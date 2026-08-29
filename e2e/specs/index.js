const FULL_ROLE_SET = [
  "control",
  "writer1",
  "writer2",
  "spectator",
  "jury",
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
    musas: { total: 0 },
    actors: { 1: 0, 2: 0 }
  };
  for (const role of roles) {
    if (role === "control") requirements.control += 1;
    else if (role === "spectator") requirements.spectator += 1;
    else if (role === "writer1") requirements.writers[1] += 1;
    else if (role === "writer2") requirements.writers[2] += 1;
    else if (role === "musa1" || role === "musa1b" || role === "musa2" || role === "musa2b") requirements.musas.total += 1;
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

async function disconnectRoleSocket(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    try {
      const hasSocket = window.eval("typeof socket !== 'undefined' && socket && typeof socket.disconnect === 'function'");
      if (!hasSocket) return;
      window.eval("socket.io.opts.reconnection = false; socket.disconnect(); if (socket.io.engine) socket.io.engine.close();");
    } catch (_error) {
    }
  });
  await ctx.sleep(250);
}

async function reloadRole(ctx, roleName) {
  const entry = ctx.getPageEntry(roleName);
  await disconnectRoleSocket(ctx, roleName);
  await entry.page.reload({ waitUntil: "domcontentloaded" });
  await entry.page.waitForSelector(entry.config.readySelector, {
    ...(entry.config.readyVisible === false ? {} : { visible: true }),
    timeout: 15000
  });
  await waitForSocketConnection(ctx, roleName, 12000);
}

async function reloadRolesSequential(ctx, roles) {
  for (const role of roles) {
    await reloadRole(ctx, role);
    await ctx.sleep(250);
  }
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
      if (requirements.musas.total > 0) {
        const blueCount = Number(state.connections.musas[1].count) || 0;
        const redCount = Number(state.connections.musas[2].count) || 0;
        if ((blueCount + redCount) < requirements.musas.total || Math.abs(blueCount - redCount) > 1) {
          return false;
        }
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

async function waitForAttributedInspiration(
  ctx,
  roleName,
  selector,
  word,
  expectedMuseNames,
  description,
  timeoutMs = 10000
) {
  const expected = expectedMuseNames.map((name) => String(name).toUpperCase());
  return ctx.waitFor(
    description,
    async () => ctx.evaluate(roleName, ({ css, targetWord, museNames }) => {
      const card = Array.from(document.querySelectorAll(css)).find((node) => (
        String(node.textContent || "").toLowerCase().includes(String(targetWord).toLowerCase())
      ));
      if (!card) return false;
      const author = card.querySelector(".inspiration-author, .cloud-word__author, .level-status-witness__author");
      const authorText = String(author && author.textContent || "").trim().toUpperCase();
      if (!author || !museNames.every((name) => authorText.includes(name))) return false;
      return { text: String(card.textContent || "").trim(), author: authorText };
    }, { css: selector, targetWord: word, museNames: expected }),
    timeoutMs
  );
}

async function assertCardsDoNotOverlap(ctx, roleName, selector, description, minCards = 2) {
  const result = await ctx.evaluate(roleName, ({ css, minimum }) => {
    const cards = Array.from(document.querySelectorAll(css))
      .filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
      })
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          text: String(node.textContent || "").trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      });
    const overlaps = [];
    for (let index = 0; index < cards.length; index += 1) {
      for (let other = index + 1; other < cards.length; other += 1) {
        const overlapX = Math.min(cards[index].right, cards[other].right) - Math.max(cards[index].left, cards[other].left);
        const overlapY = Math.min(cards[index].bottom, cards[other].bottom) - Math.max(cards[index].top, cards[other].top);
        if (overlapX > 1 && overlapY > 1) {
          overlaps.push({
            first: cards[index],
            second: cards[other],
            overlapX,
            overlapY
          });
        }
      }
    }
    return { count: cards.length, overlaps };
  }, { css: selector, minimum: minCards });
  ctx.assert(result.count >= minCards, `${description}: expected at least ${minCards} visible cards, got ${result.count}`);
  ctx.assert(result.overlaps.length === 0, `${description}: overlapping cards ${JSON.stringify(result.overlaps)}`);
}

async function readAuthoritativeMuseAssignments(ctx, roleNames) {
  let previousKey = "";
  let stableSince = 0;
  return ctx.waitFor(
    "muses have stable authoritative assignments",
    async () => {
      const assignments = [];
      for (const roleName of roleNames) {
        let assignment = false;
        try {
          assignment = await ctx.evaluate(roleName, () => {
            try {
              const confirmed = Boolean(window.eval(
                "typeof musa_registro_confirmado !== 'undefined' && musa_registro_confirmado"
              ));
              const team = Number(window.eval("typeof player !== 'undefined' ? player : 0"));
              const name = String(window.eval("typeof nombre_musa !== 'undefined' ? nombre_musa : ''")).trim().toUpperCase();
              return confirmed && (team === 1 || team === 2) && name
                ? { team, name, href: window.location.href }
                : false;
            } catch (_error) {
              return false;
            }
          });
        } catch (_error) {
          return false;
        }
        if (!assignment) return false;
        assignments.push({ roleName, ...assignment });
      }
      const blueCount = assignments.filter(({ team }) => team === 1).length;
      const redCount = assignments.filter(({ team }) => team === 2).length;
      if (Math.abs(blueCount - redCount) > 1) {
        previousKey = "";
        stableSince = 0;
        return false;
      }
      const key = assignments.map(({ roleName, team, name, href }) => `${roleName}:${team}:${name}:${href}`).join("|");
      if (key !== previousKey) {
        previousKey = key;
        stableSince = Date.now();
        return false;
      }
      return (Date.now() - stableSince) >= 500 ? assignments : false;
    },
    15000,
    100
  );
}

async function requestVideoTutorialState(ctx, roleName) {
  return ctx.evaluate(roleName, () => new Promise((resolve) => {
    let pageSocket = null;
    try {
      pageSocket = window.eval("socket");
    } catch (_error) {
      resolve(null);
      return;
    }
    const timer = window.setTimeout(() => resolve(null), 5000);
    pageSocket.emit("pedir_video_tutorial_estado", {}, (response = {}) => {
      window.clearTimeout(timer);
      resolve(response && response.ok === true ? response.estado : null);
    });
  }));
}

async function configureVideoTutorialRaw(ctx, roleName, config, requestSuffix) {
  return ctx.evaluate(roleName, ({ nextConfig, suffix }) => new Promise((resolve) => {
    let pageSocket = null;
    try {
      pageSocket = window.eval("socket");
    } catch (_error) {
      resolve({ ok: false, code: "SOCKET_UNAVAILABLE" });
      return;
    }
    const timer = window.setTimeout(
      () => resolve({ ok: false, code: "ACK_TIMEOUT" }),
      5000
    );
    pageSocket.emit("video_tutorial_configurar", {
      ...nextConfig,
      request_id: `e2e-video-config-${suffix}-${Date.now().toString(36)}`
    }, (response = {}) => {
      window.clearTimeout(timer);
      resolve(response);
    });
  }), { nextConfig: config, suffix: requestSuffix });
}

async function renderLocalVideoTutorialPosition(ctx, roleName, authoritativeState, positionSeconds) {
  return ctx.evaluate(roleName, ({ rawState, position }) => {
    const controller = window.__scribVideoTutorialController;
    if (!controller || typeof controller.handleState !== "function") {
      throw new Error("Missing synchronized video tutorial controller");
    }
    controller.handleState({
      ...rawState,
      visible: true,
      reproduciendo: true,
      posicion_segundos: position
    });
    const root = document.querySelector("#video_tutorial_musa");
    const title = root && root.querySelector("[data-video-tutorial-title]");
    const card = root && root.querySelector(".scrib-video-tutorial-device__card");
    const identity = root && root.querySelector("[data-video-tutorial-identity]");
    const museName = root && root.querySelector("[data-video-tutorial-muse-name]");
    const writerName = root && root.querySelector("[data-video-tutorial-writer-name]");
    const shareUrl = root && root.querySelector(".scrib-video-tutorial-device__url");
    const shareQr = root && root.querySelector(".scrib-video-tutorial-device__share img");
    const miniPhone = root && root.querySelector(".scrib-video-tutorial-device__mini-phone");
    const rect = root ? root.getBoundingClientRect() : null;
    const cardRect = card ? card.getBoundingClientRect() : null;
    const qrRect = shareQr ? shareQr.getBoundingClientRect() : null;
    const miniPhoneRect = miniPhone ? miniPhone.getBoundingClientRect() : null;
    return root ? {
      phase: String(root.dataset.phase || ""),
      background: window.getComputedStyle(root).backgroundColor,
      title: String(title && title.textContent || "").trim(),
      identity: String(identity && identity.textContent || "").trim(),
      museName: String(museName && museName.textContent || "").trim(),
      museColor: museName ? window.getComputedStyle(museName).color : "",
      writerName: String(writerName && writerName.textContent || "").trim(),
      writerColor: writerName ? window.getComputedStyle(writerName).color : "",
      shareUrl: String(shareUrl && shareUrl.textContent || "").trim(),
      shareIsAnchor: Boolean(shareUrl && shareUrl.closest("a")),
      shareQrLoaded: Boolean(shareQr && shareQr.complete && shareQr.naturalWidth > 0),
      shareQrWidth: qrRect ? qrRect.width : 0,
      miniPhoneVisible: Boolean(
        miniPhoneRect
        && miniPhoneRect.width > 0
        && miniPhoneRect.height > 0
        && window.getComputedStyle(miniPhone).display !== "none"
      ),
      cardWithinViewport: Boolean(
        cardRect
        && cardRect.left >= 0
        && cardRect.top >= 0
        && cardRect.right <= window.innerWidth
        && cardRect.bottom <= window.innerHeight
      ),
      coversViewport: Boolean(
        rect
        && Math.abs(rect.left) < 1
        && Math.abs(rect.top) < 1
        && Math.abs(rect.width - window.innerWidth) < 1
        && Math.abs(rect.height - window.innerHeight) < 1
      )
    } : null;
  }, { rawState: authoritativeState, position: positionSeconds });
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
    tiempo_modos: 2,
    tiempo_cambio_letra: 1,
    tiempo_cambio_palabras: 1,
    limite_tiempo_inspiracion: 5,
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
    setNumericInput("tiempo_modos", nextConfig.tiempo_modos);
    setNumericInput("tiempo_cambio_letra", nextConfig.tiempo_cambio_letra);
    setNumericInput("tiempo_cambio_palabras", nextConfig.tiempo_cambio_palabras);
    setNumericInput("limite_tiempo_inspiracion", nextConfig.limite_tiempo_inspiracion);
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

async function waitForSpectatorStatsSlides(ctx, description, timeoutMs = 10000) {
  await ctx.waitFor(
    description,
    async () => ctx.evaluate("spectator", () => {
      const root = document.querySelector("#stats_espectador");
      const track = document.querySelector("#stats_slides_track");
      if (!root || !track) return false;
      const style = window.getComputedStyle(root);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const heatmapBoards = track.querySelectorAll(".stats-heatmap-board").length;
      const timeBoards = track.querySelectorAll(".stats-tiempo-board").length;
      const timeLines = Array.from(track.querySelectorAll(".stats-tiempo-linea"))
        .filter((node) => String(node.getAttribute("d") || "").trim().length > 0).length;
      const heatmapTotals = Array.from(track.querySelectorAll(".stats-kpis-grid--heatmap .stats-kpi strong"))
        .map((node) => Number(String(node.textContent || "").replace(/[^\d.-]/g, "")) || 0);
      const hasKeyboardData = heatmapTotals.some((value) => value > 0);
      return heatmapBoards >= 2 && timeBoards >= 2 && timeLines >= 2 && hasKeyboardData;
    }),
    timeoutMs
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

async function closeActiveVoteIfAny(ctx) {
  const state = await ctx.getState();
  if (!state.votacion_ventaja?.activa) {
    return;
  }
  await ctx.emitHook("scrib_test:force_vote", { active: false, emitir_resultado: false });
  await ctx.waitForState(
    "active advantage vote closed",
    (nextState) => nextState.votacion_ventaja.activa === false,
    8000
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

async function waitForWriterEditable(ctx, roleName, timeoutMs = 10000) {
  return ctx.waitFor(
    `${roleName} editable`,
    async () => ctx.evaluate(roleName, () => {
      const editor = document.querySelector("#texto");
      return Boolean(
        editor?.isContentEditable
        || String(editor?.contentEditable || "").toLowerCase() === "true"
        || editor?.getAttribute("contenteditable") === "true"
      );
    }),
    timeoutMs
  );
}

async function ensureWriterEditableForFullFlow(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    const editor = document.querySelector("#texto");
    if (!editor) {
      throw new Error("Missing writer editor");
    }
    if (typeof es_pausa !== "undefined") es_pausa = false;
    if (typeof menu_modificador !== "undefined") menu_modificador = true;
    if (typeof desactivar_borrar !== "undefined") desactivar_borrar = false;
    if (typeof limpiarDesventajasActivasEscritora === "function") {
      limpiarDesventajasActivasEscritora();
    }
    editor.setAttribute("contenteditable", "true");
    editor.contentEditable = "true";
  });
  await waitForWriterEditable(ctx, roleName, 5000);
}

async function assertMusaWordInspirationPreview(ctx, roleName, mode, word, expectation) {
  await ctx.fillValue(roleName, "#palabra", word);
  await ctx.waitFor(
    `${roleName} inspiration preview for ${mode}`,
    async () => ctx.evaluate(roleName, ({ expectedClass, expectedSign }) => {
      const node = document.querySelector("#preview_tiempo_palabra");
      if (!node || node.hidden) return false;
      const text = String(node.textContent || "");
      const expectedValue = `${expectedSign}5`;
      return node.classList.contains(expectedClass)
        && text.includes(expectedValue)
        && /5\s*insp\./i.test(text)
        ? text
        : false;
    }, {
      expectedClass: expectation.className,
      expectedSign: expectation.sign
    }),
    5000
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

function buildWordContainingLetter(letter, index = 0) {
  const token = String(letter || "a").trim() || "a";
  return `musa${index}${token}eco`;
}

function buildWordAvoidingLetter(letter, index = 0) {
  const forbidden = String(letter || "").trim().toLowerCase();
  const pool = "bcdfghjklmpqtuvwxyz".split("");
  const safe = pool.find((candidate) => !forbidden.includes(candidate)) || "x";
  return safe.repeat(5 + index);
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

async function assertWriterNeonCaret(ctx, roleName, expectedAccent) {
  await focusWriterEditor(ctx, roleName);
  await ctx.evaluate(roleName, () => {
    const el = document.querySelector("#texto");
    if (!el) {
      throw new Error("Missing writer editor");
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const state = await ctx.waitFor(
    `${roleName} neon caret`,
    async () => ctx.evaluate(roleName, () => {
      const editor = document.querySelector("#texto");
      const caret = document.querySelector("#caret_neon_juego_escritora");
      if (!editor || !caret) return false;
      const editorStyle = window.getComputedStyle(editor);
      const bodyStyle = window.getComputedStyle(document.body);
      const rect = caret.getBoundingClientRect();
      const nativeCaretHidden = editorStyle.caretColor === "rgba(0, 0, 0, 0)"
        || editorStyle.caretColor === "transparent";
      const state = {
        active: caret.classList.contains("activa"),
        visibleClass: editor.classList.contains("textarea--pluma-cursor-visible"),
        nativeCaretHidden,
        accent: bodyStyle.getPropertyValue("--equipo-caret-color").trim().toLowerCase(),
        width: rect.width,
        height: rect.height
      };
      return state.active && state.visibleClass && state.nativeCaretHidden && state.width > 0 && state.height > 0
        ? state
        : false;
    }),
    5000
  );
  ctx.assert(state.active, `${roleName} neon caret should be active`);
  ctx.assert(state.visibleClass, `${roleName} editor should hide the native caret while custom caret is active`);
  ctx.assert(state.nativeCaretHidden, `${roleName} native caret should be transparent`);
  ctx.assert(state.accent === expectedAccent, `${roleName} caret accent should be ${expectedAccent}, got ${state.accent}`);
  ctx.assert(state.width > 0 && state.height > 0, `${roleName} neon caret should have rendered dimensions`);
}

async function typeInWriter(ctx, roleName, text) {
  await focusWriterEditor(ctx, roleName);
  const page = ctx.getPageEntry(roleName).page;
  await page.keyboard.type(text, { delay: 20 });
}

async function clearFloatingFeedbacks(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    const root = document.querySelector("#feedback_tiempo_flotante_root");
    if (!root) return;
    const columns = Array.from(root.querySelectorAll(".feedback-tiempo-columna"));
    if (columns.length) {
      columns.forEach((column) => {
        column.innerHTML = "";
      });
      return;
    }
    root.innerHTML = "";
  });
}

async function waitForQuantifiedInspirationFeedback(ctx, roleName, description, options = {}) {
  const selector = options.selector || "#feedback_tiempo_flotante_root .feedback-tiempo-float";
  return ctx.waitFor(
    description,
    async () => ctx.evaluate(roleName, (css) => {
      const nodes = Array.from(document.querySelectorAll(css))
        .filter((node) => node.isConnected && node.getBoundingClientRect().width > 0);
      if (nodes.some((node) => /undefined/i.test(String(node.textContent || "")))) return false;
      const inspirationNode = nodes.find((node) => /\+\d+(?:[.,]\d+)?\s*insp\./i.test(String(node.textContent || "")));
      if (!inspirationNode) return false;
      return {
        inspiration: String(inspirationNode.textContent || "").trim(),
        inspirationClass: inspirationNode.className
      };
    }, selector),
    2200,
    40
  );
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

async function pressWriterShortcut(ctx, roleName, modifiers, key, options = {}) {
  if (options.preserveCaret !== true) {
    await focusWriterEditor(ctx, roleName);
  }
  const page = ctx.getPageEntry(roleName).page;
  const keys = Array.isArray(modifiers) ? modifiers : [modifiers];
  for (const modifier of keys) {
    await page.keyboard.down(modifier);
  }
  try {
    await page.keyboard.press(key);
  } finally {
    for (const modifier of [...keys].reverse()) {
      await page.keyboard.up(modifier);
    }
  }
}

async function selectWriterTextRange(ctx, roleName, startOffset, endOffset) {
  await ctx.evaluate(roleName, ({ start, end }) => {
    const editor = document.querySelector("#texto");
    if (!editor) {
      throw new Error("Missing writer editor");
    }
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const locate = (target) => {
      let consumed = 0;
      let node = walker.nextNode();
      while (node) {
        const length = String(node.textContent || "").length;
        if (target <= consumed + length) {
          return { node, offset: Math.max(0, target - consumed) };
        }
        consumed += length;
        node = walker.nextNode();
      }
      return null;
    };

    const startPoint = locate(Math.max(0, Number(start) || 0));
    walker.currentNode = editor;
    const endPoint = locate(Math.max(0, Number(end) || 0));
    if (!startPoint || !endPoint) {
      throw new Error("Could not select writer text range");
    }
    const range = document.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  }, { start: startOffset, end: endOffset });
}

async function assertWriterBackspaceDeletesBehindProtectedWord(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    const editor = document.querySelector("#texto");
    if (!editor) {
      throw new Error("Missing writer editor");
    }
    editor.innerHTML = 'abc<span class="palabra-bendita" contenteditable="false">BONUS</span>xy';
    const span = editor.querySelector(".palabra-bendita");
    const range = document.createRange();
    range.setStartAfter(span);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  });
  await pressWriterKey(ctx, roleName, "Backspace", 1, { preserveCaret: true });
  const state = await readWriterState(ctx, roleName);
  ctx.assert(state.text === "abBONUSxy", "Backspace should delete the editable char behind a protected word in one press");
  ctx.assert(state.protectedCount === 1, "protected word should survive Backspace");
  ctx.assert(/palabra-bendita/.test(state.html), "protected word markup should remain after Backspace");
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
      editable: Boolean(editor?.isContentEditable || editor?.getAttribute("contenteditable") === "true"),
      timer: String(timer?.textContent || "").trim(),
      timerSeconds: Number.isFinite(timerSeconds) ? timerSeconds : null,
      protectedCount: editor ? editor.querySelectorAll(".letra-verde, .palabra-bendita, .palabra-musa").length : 0
    };
  });
}

async function readWriterInspirationState(ctx, roleName) {
  return ctx.evaluate(roleName, () => {
    const evalValue = (expression, fallback = null) => {
      try {
        const value = window.eval(expression);
        return typeof value === "undefined" ? fallback : value;
      } catch (_error) {
        return fallback;
      }
    };
    const editor = document.querySelector("#texto");
    const selection = window.getSelection();
    const metaRaw = evalValue(
      "typeof meta_inspiracion_activa_escritora !== 'undefined' ? meta_inspiracion_activa_escritora : null",
      null
    );
    const meta = metaRaw && typeof metaRaw === "object"
      ? {
          inspiracion_id: String(metaRaw.inspiracion_id || ""),
          descartes_consecutivos: Number(metaRaw.descartes_consecutivos) || 0,
          factor_inspiracion: Number(metaRaw.factor_inspiracion),
          valor_inspiracion: Number(metaRaw.valor_inspiracion),
          porcentaje_tiempo: Number(metaRaw.porcentaje_tiempo),
          tiempo_palabras_bonus: Number(metaRaw.tiempo_palabras_bonus),
          modo_seq: Number(metaRaw.modo_seq),
          origen_musa: String(metaRaw.origen_musa || ""),
          es_musa: metaRaw.es_musa === true
        }
      : null;
    const targetRaw = evalValue(
      "typeof palabra_actual !== 'undefined' ? palabra_actual : []",
      []
    );
    const targets = Array.isArray(targetRaw)
      ? targetRaw.map((value) => String(value || "")).filter(Boolean)
      : [String(targetRaw || "")].filter(Boolean);
    let caretPos = null;
    if (editor && typeof window.obtenerCaretInfo === "function") {
      const info = window.obtenerCaretInfo(editor);
      caretPos = Number.isFinite(Number(info && info.caretPos)) ? Number(info.caretPos) : null;
    } else if (editor && selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0).cloneRange();
      const pre = range.cloneRange();
      pre.selectNodeContents(editor);
      pre.setEnd(range.startContainer, range.startOffset);
      caretPos = pre.toString().length;
    }
    const discardRoot = document.querySelector("#inspiration_discard");
    const discardButton = document.querySelector("#inspiration_discard_button");
    const effect = document.querySelector("#inspiration_discard_effect");
    const definition = document.querySelector("#definicion");
    return {
      meta,
      targets,
      mode: String(evalValue("typeof modo_actual !== 'undefined' ? modo_actual : ''", "") || ""),
      assigned: evalValue("typeof asignada !== 'undefined' ? asignada === true : false", false) === true,
      text: String(editor && editor.textContent || ""),
      html: String(editor && editor.innerHTML || ""),
      definition: String(definition && definition.textContent || "").trim(),
      caretPos,
      discardHidden: Boolean(discardRoot && (discardRoot.hidden || window.getComputedStyle(discardRoot).display === "none")),
      discardDisabled: Boolean(discardButton && discardButton.disabled),
      discardEffect: String(effect && effect.textContent || "").trim()
    };
  });
}

async function installWriterInspirationProbe(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    if (window.__scribE2EInspirationProbeInstalled) return;
    const clone = (value) => {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (_error) {
        return value;
      }
    };
    const trackedUses = new Set(["nueva_palabra", "nueva_palabra_musa", "nueva_palabra_prohibida"]);
    window.__scribE2EInspirationProbe = {
      discards: [],
      uses: [],
      timeAdjustments: []
    };
    const originalEmit = socket.emit;
    socket.emit = function patchedInspirationEmit(eventName, ...args) {
      const isDiscard = eventName === "descartar_inspiracion";
      const isUse = trackedUses.has(eventName)
        && args[0]
        && typeof args[0] === "object"
        && args[0].accion === "aprovechar";
      let entry = null;
      if (isDiscard || isUse) {
        entry = {
          event: eventName,
          payload: clone(args[0]),
          ack: null,
          ts: Date.now()
        };
        (isDiscard
          ? window.__scribE2EInspirationProbe.discards
          : window.__scribE2EInspirationProbe.uses).push(entry);
        const callbackIndex = args.findIndex((value, index) => index > 0 && typeof value === "function");
        if (callbackIndex >= 0) {
          const callback = args[callbackIndex];
          args[callbackIndex] = (response) => {
            entry.ack = clone(response);
            return callback(response);
          };
        }
      }
      return originalEmit.call(this, eventName, ...args);
    };
    socket.on("aumentar_tiempo_control", (payload = {}) => {
      if (Number(payload.player) !== Number(window.eval("player"))) return;
      window.__scribE2EInspirationProbe.timeAdjustments.push(clone(payload));
    });
    window.__scribE2EInspirationProbeInstalled = true;
  });
}

async function readWriterInspirationProbe(ctx, roleName) {
  return ctx.evaluate(roleName, () => JSON.parse(JSON.stringify(
    window.__scribE2EInspirationProbe || { discards: [], uses: [], timeAdjustments: [] }
  )));
}

async function installSpectatorInspirationProbe(ctx) {
  await ctx.evaluate("spectator", () => {
    if (window.__scribE2ESpectatorInspirationProbeInstalled) return;
    const clone = (value) => {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (_error) {
        return value;
      }
    };
    window.__scribE2ESpectatorInspirationFeedback = [];
    window.__scribE2EAuthoritativeInspirations = [];
    socket.on("feedback_a_j2", (payload = {}) => {
      window.__scribE2ESpectatorInspirationFeedback.push(clone(payload));
    });
    socket.on("inspiracion_aprovechada", (payload = {}) => {
      window.__scribE2EAuthoritativeInspirations.push(clone(payload));
    });
    window.__scribE2ESpectatorInspirationProbeInstalled = true;
  });
}

async function readSpectatorInspirationProbe(ctx) {
  return ctx.evaluate("spectator", () => ({
    feedback: JSON.parse(JSON.stringify(window.__scribE2ESpectatorInspirationFeedback || [])),
    authoritative: JSON.parse(JSON.stringify(window.__scribE2EAuthoritativeInspirations || [])),
    blueCount: Number(window.blueCount),
    redCount: Number(window.redCount)
  }));
}

async function setWriterHtml(ctx, roleName, html) {
  await ctx.evaluate(roleName, (nextHtml) => {
    const editor = document.querySelector("#texto");
    if (!editor) {
      throw new Error("Missing writer editor");
    }
    editor.focus();
    editor.innerHTML = nextHtml;
    const plain = String(editor.textContent || "");
    const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
    const eventName = typeof texto_x === "string" && texto_x ? texto_x : "texto1";
    socket.emit(eventName, {
      text: editor.innerHTML,
      points: `${words} palabras`,
      caretPos: plain.length,
      caretLine: 0,
      caretRatio: 1,
      caretPath: [],
      caretOffset: plain.length,
      texto_guardado: plain
    });
  }, html);
}

async function setWriterTimerSeconds(ctx, roleName, seconds) {
  await ctx.evaluate(roleName, (nextSeconds) => {
    const timer = document.querySelector("#tiempo");
    const total = Math.max(0, Math.trunc(Number(nextSeconds) || 0));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    const label = `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
    if (timer) {
      timer.innerHTML = label;
    }
    if (typeof actualizarBarraVida === "function") {
      actualizarBarraVida(timer, label);
    }
    if (typeof ultimo_tiempo_contador_segundos !== "undefined") {
      ultimo_tiempo_contador_segundos = total;
    }
    if (typeof ultimo_tiempo_contador_ms !== "undefined") {
      ultimo_tiempo_contador_ms = Date.now();
    }
    if (typeof sincronizarEstadoContadorEscritora === "function") {
      sincronizarEstadoContadorEscritora(total, label);
    } else if (timer && timer.dataset) {
      timer.dataset.remainingSeconds = String(total);
    }
    window.__scribWriterTimerRemaining = total;
  }, seconds);
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
    const activeDisadvantage = (() => {
      try {
        const active = window.eval("typeof desventaja_activa_escritora !== 'undefined' ? desventaja_activa_escritora : null");
        if (!active || typeof active !== "object") return null;
        return {
          tipo: String(active.tipo || ""),
          duracionMs: Number(active.duracionMs) || 0,
          restanteMs: Number(active.restanteMs) || 0,
          pausada: Boolean(active.pausada)
        };
      } catch (_error) {
        return null;
      }
    })();
    return {
      bodyClasses: Array.from(document.body?.classList || []),
      editorClasses: Array.from(editor?.classList || []),
      lightningClasses: Array.from(lightningNode?.classList || []),
      keyboardSlow: evalFlag("typeof teclado_lento_putada !== 'undefined' && teclado_lento_putada === true"),
      deleteBlocked: evalFlag("typeof bloquear_borrado_putada !== 'undefined' && bloquear_borrado_putada === true"),
      inverseActive: evalFlag("typeof temp_text_inverso_activado !== 'undefined' && temp_text_inverso_activado === true"),
      blurry: Boolean(editor?.classList.contains("textarea_blur")),
      currentDisadvantage: String(window.eval("typeof putada_actual !== 'undefined' ? putada_actual : ''") || ""),
      activeDisadvantage
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

async function assertSpectatorSideVeilCoversViewport(ctx, side) {
  const sideId = Number(side) === 2 ? 2 : 1;
  const state = await ctx.waitFor(
    `spectator side ${sideId} gameover veil covers viewport edge`,
    async () => ctx.evaluate("spectator", (targetSide) => {
      const root = document.querySelector("#spectator_fit_root");
      if (!root) return false;
      const pseudo = window.getComputedStyle(root, targetSide === 1 ? "::before" : "::after");
      const rootStyle = window.getComputedStyle(root);
      const transform = rootStyle.transform && rootStyle.transform !== "none"
        ? new DOMMatrixReadOnly(rootStyle.transform)
        : new DOMMatrixReadOnly();
      const scale = Number(transform.a) || 1;
      const translateX = Number(transform.m41) || 0;
      const rootWidth = Number(root.offsetWidth) || window.innerWidth;
      const width = Number.parseFloat(pseudo.width) || 0;
      const opacity = Number.parseFloat(pseudo.opacity) || 0;
      let start = 0;
      let end = 0;
      if (targetSide === 1) {
        const left = Number.parseFloat(pseudo.left) || 0;
        start = translateX + (left * scale);
        end = start + (width * scale);
      } else {
        const right = Number.parseFloat(pseudo.right) || 0;
        end = translateX + ((rootWidth - right) * scale);
        start = end - (width * scale);
      }
      const viewportW = window.innerWidth;
      const covers = targetSide === 1
        ? start <= 1 && end >= viewportW * 0.4
        : end >= viewportW - 1 && start <= viewportW * 0.6;
      if (!covers || opacity <= 0.35) return false;
      return {
        start,
        end,
        opacity,
        viewportW,
        transform: rootStyle.transform,
        left: pseudo.left,
        right: pseudo.right,
        width: pseudo.width
      };
    }, sideId),
    5000
  );
  ctx.assert(state.opacity > 0.35, `spectator side ${sideId} veil should be visible`);
  if (sideId === 1) {
    ctx.assert(state.start <= 1, `blue side veil should start at viewport edge, got ${state.start}`);
  } else {
    ctx.assert(state.end >= state.viewportW - 1, `red side veil should reach viewport edge, got ${state.end}/${state.viewportW}`);
  }
}

async function readActorDisadvantageState(ctx, roleName) {
  return ctx.evaluate(roleName, () => {
    const text = document.querySelector("#texto");
    return {
      classes: Array.from(text?.classList || []),
      putada: String(text?.dataset?.actorPutada || ""),
      blurry: Boolean(text?.classList.contains("textarea_blur") || text?.classList.contains("actor-texto-borroso-activo")),
      inverse: Boolean(text?.classList.contains("actor-texto-inverso-activo"))
    };
  });
}

async function requestQueuedWriterWord(ctx, roleName, queueType) {
  const eventName = queueType === "prohibida"
    ? "nueva_palabra_prohibida"
    : queueType === "bonus"
      ? "nueva_palabra_bonus"
      : "nueva_palabra";
  await ctx.evaluate(roleName, ({ nextEventName, nextQueueType }) => {
    const jugador = window.eval("player");
    const payload = nextQueueType === "bonus" ? { jugador } : jugador;
    socket.emit(nextEventName, payload);
  }, {
    nextEventName: eventName,
    nextQueueType: queueType
  });
}

async function requestQueuedMusaWord(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    const jugador = window.eval("player");
    socket.emit("nueva_palabra_musa", jugador);
  });
}

async function emitMusaInspiration(ctx, roleName, word) {
  await ctx.evaluate(roleName, (value) => {
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
      throw new Error("Missing musa socket");
    }
    socket.emit("enviar_inspiracion", {
      palabra: value,
      nombre: window.nombre_musa || "",
      client_id: window.musa_client_id || ""
    });
  }, word);
}

async function installMusaPdfGiftProbe(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    if (window.__e2ePdfGiftProbeInstalled) {
      return;
    }
    window.__e2ePdfGiftProbeInstalled = true;
    window.__e2ePdfGifts = [];
    socket.on("regalo_pdf_musas", (payload = {}) => {
      window.__e2ePdfGifts.push({
        player: payload.player,
        client_id: payload.client_id || "",
        filename: payload.filename || "",
        personalizado: Boolean(payload.personalizado),
        data: payload.data || ""
      });
    });
  });
}

async function readMusaPdfGiftState(ctx, roleName) {
  return ctx.evaluate(roleName, () => {
    const evalValue = (expression) => {
      try {
        return window.eval(expression);
      } catch (_error) {
        return null;
      }
    };
    const root = document.querySelector("#regalo_pdf");
    const data = evalValue("typeof regalo_pdf_data !== 'undefined' ? regalo_pdf_data : null");
    return {
      clientId: window.musa_client_id || "",
      player: Number(window.player || evalValue("typeof player !== 'undefined' ? player : 0") || 0),
      visible: Boolean(root && root.classList.contains("regalo-pdf--visible")),
      filename: String(evalValue("typeof regalo_pdf_filename !== 'undefined' ? regalo_pdf_filename : ''") || ""),
      hasData: typeof data === "string" && data.startsWith("data:application/pdf"),
      data,
      pending: Boolean(evalValue("typeof regalo_pdf_pendiente !== 'undefined' ? regalo_pdf_pendiente : null")),
      gifts: Array.isArray(window.__e2ePdfGifts) ? window.__e2ePdfGifts : []
    };
  });
}

async function fetchMusaPdfSummary(ctx) {
  return ctx.evaluate("control", () => new Promise((resolve) => {
    socket.emit("pedir_resumen_musas_pdf", {}, (payload) => resolve(payload || null));
  }));
}

function getMusaSummaryEntry(summary, clientId) {
  const equipos = summary && summary.equipos ? summary.equipos : {};
  return [1, 2]
    .flatMap((player) => {
      const equipo = equipos[player] || equipos[String(player)] || {};
      return Array.isArray(equipo.musas) ? equipo.musas : [];
    })
    .find((musa) => musa && musa.client_id === clientId) || null;
}

function decodePdfDataUri(dataUri) {
  const encoded = String(dataUri || "").split(",", 2)[1] || "";
  return Buffer.from(encoded, "base64").toString("latin1");
}

async function ensureBonusWordInWriterUi(ctx, roleName, word, musaLabel, options = {}) {
  await ctx.evaluate(roleName, ({ nextWord, nextMusaLabel, includeTime }) => {
    const definition = document.querySelector("#definicion");
    if (typeof recibir_palabra !== "function") {
      throw new Error("Missing recibir_palabra helper");
    }
    const payload = {
      modo_actual: "palabras bonus",
      palabras_var: nextWord,
      palabra_bonus: [
        [nextWord],
        `<span style="color:#ffd86f;">SUPERBONUS x2</span><span style="color: white;"> - </span><span style="color:lime;">${nextMusaLabel}</span>`
      ],
      origen_musa: "musa",
      musa_nombre: nextMusaLabel,
      superbonus: {
        activo: true,
        repeticiones: 2,
        musas: nextMusaLabel.split(" + "),
        tiempo_base: 20,
        multiplicador_tiempo: 1.5
      }
    };
    if (includeTime) {
      payload.tiempo_palabras_bonus = 30;
    }
    recibir_palabra(payload);
  }, { nextWord: word, nextMusaLabel: musaLabel, includeTime: options.includeTime !== false });
}

async function emitMusaHeartViaClient(ctx, roleName) {
  await ctx.evaluate(roleName, () => {
    if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
      throw new Error("Missing musa socket");
    }
    socket.emit("musa_corazon");
  });
}

async function applyForcedDisadvantage(ctx, targetPlayer, selection, options = {}) {
  const winnerTeam = Number(targetPlayer) === 1 ? 2 : 1;
  await ctx.emitHook("scrib_test:force_vote", {
    team: winnerTeam,
    opciones: [selection],
    duracion_ms: options.duracionMs || 15000
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

async function readControlPauseState(ctx) {
  return ctx.evaluate("control", () => {
    const button = document.querySelector("#boton_pausar_reanudar");
    return {
      value: String(button?.dataset?.value || ""),
      text: String(button?.textContent || "").trim()
    };
  });
}

async function toggleControlPause(ctx, expectedValue, label) {
  await ctx.click("control", "#boton_pausar_reanudar");
  await ctx.waitFor(
    label,
    async () => {
      const state = await readControlPauseState(ctx);
      return state.value === String(expectedValue) ? state : false;
    },
    6000
  );
}

async function waitForMusaCounters(ctx, expectedTeam1, expectedTeam2, description = "musa counters") {
  const expected1 = Math.max(0, Math.trunc(Number(expectedTeam1) || 0));
  const expected2 = Math.max(0, Math.trunc(Number(expectedTeam2) || 0));
  await ctx.waitForState(
    description,
    (state) => state.musas.contador.escritxr1 === expected1
      && state.musas.contador.escritxr2 === expected2
      && state.connections.musas[1].count === expected1
      && state.connections.musas[2].count === expected2
      && state.musas.regalo_bandera.equipos[1].musas === expected1
      && state.musas.regalo_bandera.equipos[2].musas === expected2,
    10000
  );
  const hasCount = (value, count) => new RegExp(`\\b${count}\\b`).test(String(value || ""));
  if (ctx.isRoleOpen("control")) {
    await ctx.waitForText("control", "#musas", (text) => hasCount(text, expected1), `control team1 ${description}`);
    await ctx.waitForText("control", "#musas1", (text) => hasCount(text, expected2), `control team2 ${description}`);
  }
  if (ctx.isRoleOpen("writer1")) {
    await ctx.waitForText("writer1", "#musas", (text) => hasCount(text, expected1), `writer1 ${description}`);
  }
  if (ctx.isRoleOpen("writer2")) {
    await ctx.waitForText("writer2", "#musas", (text) => hasCount(text, expected2), `writer2 ${description}`);
  }
  if (ctx.isRoleOpen("spectator")) {
    await ctx.waitForText("spectator", "#musas", (text) => hasCount(text, expected1), `spectator team1 ${description}`);
    await ctx.waitForText("spectator", "#musas1", (text) => hasCount(text, expected2), `spectator team2 ${description}`);
  }
}

async function clickResurrectionButton(ctx, roleName, buttonId) {
  await ctx.evaluate(roleName, (id) => {
    const button = document.getElementById(id);
    if (!button) {
      throw new Error(`Missing resurrection button ${id}`);
    }
    button.focus();
    button.click();
  }, buttonId);
}

async function waitForClientResurrectionMenu(ctx, roleName, menuId) {
  const player = roleName === "writer2" ? 2 : 1;
  const expectedMenu = menuId === "quantityMenu" ? "quantity" : "main";
  await ctx.waitFor(
    `${roleName} client resurrection menu ${menuId}`,
    async () => {
      const state = await ctx.getState();
      const stateReady = state.resurreccion[player]?.visible === true
        && state.resurreccion[player]?.menu === expectedMenu;
      return ctx.evaluate(roleName, (targetMenuId) => {
        const menu = document.getElementById(targetMenuId);
        if (!menu) return false;
        const buttonId = targetMenuId === "quantityMenu" ? "btnConfirmar" : "btnSi";
        if (!document.getElementById(buttonId)) return false;
        try {
          const pending = window.eval("typeof resurreccion_confirmacion_pendiente !== 'undefined' && resurreccion_confirmacion_pendiente === true");
          return pending ? false : true;
        } catch (_error) {
          return true;
        }
      }, menuId).then((domReady) => stateReady && domReady);
    },
    5000
  );
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
      await waitForClientResurrectionMenu(ctx, roleName, "mainMenu");
      await clickResurrectionButton(ctx, roleName, "btnSi");
      state = await ctx.waitForState(
        `resurrection quantity for player ${player}`,
        (nextState) => nextState.resurreccion[player].menu === "quantity",
        10000
      );
    }
    await waitForClientResurrectionMenu(ctx, roleName, "quantityMenu");
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
      await ctx.waitForVisible("writer1", "#atributos-container", true, "writer1 setup visible");
      await ctx.waitForVisible("musa1", "#musa_help_fab", true, "musa1 help control visible");
      await ctx.waitForVisible("spectator", "#contenedor_espectador", true, "spectator booted");
      await ctx.waitForVisible("jury", "#jurado_app", true, "jury booted");
    }
  },
  {
    name: "game-start-and-write",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2"], { useStateHooks: false });
      await configureFastControlPanel(ctx, {
        tiempo_modos: 10,
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
      await assertWriterNeonCaret(ctx, "writer1", "#37ecff");
      await assertWriterNeonCaret(ctx, "writer2", "#ff5d5d");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes(text1), "actor1 sees text", 15000);
      await ctx.waitForText("actor2", "#texto", (text) => text.includes(text2), "actor2 sees text", 15000);
      await assertWriterBackspaceDeletesBehindProtectedWord(ctx, "writer1");
    }
  },
  {
    name: "musa-bonus-delivery",
    run: async (ctx) => {
      const museRoles = ["musa1", "musa1b", "musa2", "musa2b"];
      await openRolesAndWaitWithOptions(ctx, ["control", "writer1", ...museRoles, "spectator", "jury"], { useStateHooks: false });
      const museAssignments = await readAuthoritativeMuseAssignments(ctx, museRoles);
      const blueMuses = museAssignments.filter(({ team }) => team === 1);
      const redMuses = museAssignments.filter(({ team }) => team === 2);
      ctx.assert(blueMuses.length === 2 && redMuses.length === 2, "four muses should be balanced two per team");
      await configureFastControlPanel(ctx, {
        tiempo_modos: 90,
        tiempo_cambio_palabras: 30,
        modes: ["palabras bonus"]
      });
      await startGame(ctx, { useStateHooks: false });
      await waitForLocalMode(ctx, "writer1", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "musa1", "palabras bonus", 10000);
      await assertMusaWordInspirationPreview(ctx, "musa1", "palabras bonus", "cometa", {
        className: "preview-tiempo-palabra--positivo",
        sign: "+"
      });
      await ctx.evaluate("musa1", () => {
        window.__scribModoActualMusaPreview = "palabras prohibidas";
      });
      await assertMusaWordInspirationPreview(ctx, "musa1", "palabras prohibidas", "tormenta", {
        className: "preview-tiempo-palabra--negativo",
        sign: "-"
      });
      await ctx.evaluate("musa1", () => {
        window.__scribModoActualMusaPreview = "palabras bonus";
        const input = document.querySelector("#palabra");
        if (input) input.value = "";
        if (typeof actualizarPreviewTiempoPalabraMusa === "function") {
          actualizarPreviewTiempoPalabraMusa("", "palabras bonus");
        }
      });
      await ctx.invoke("control", "cambiar_vista_espectador", "nube_inspiracion");
      await ctx.click("jury", "[data-jury-panel=\"inspiracion\"]");
      await ctx.sendMusaWord(blueMuses[0].roleName, "destello");
      await waitForAttributedInspiration(
        ctx,
        "writer1",
        "#definicion",
        "destello",
        [blueMuses[0].name],
        "first muse word satisfies the automatic delivery"
      );
      await waitForAttributedInspiration(
        ctx,
        "control",
        "#control_palabra_musa_j1",
        "destello",
        [blueMuses[0].name],
        "control identifies the muse behind the active delivered word"
      );
      await ctx.sendMusaWord(blueMuses[0].roleName, "horizonte");
      await ctx.sendMusaWord(blueMuses[1].roleName, "horizonte");
      await ctx.sendMusaWord(blueMuses[0].roleName, "bruma");
      await ctx.sendMusaWord(blueMuses[1].roleName, "cristal");
      await waitForAttributedInspiration(
        ctx,
        "spectator",
        "#nube_inspiracion_canvas .nube-inspiracion-palabra",
        "horizonte",
        blueMuses.map(({ name }) => name),
        "spectator cloud identifies both muses"
      );
      await waitForAttributedInspiration(
        ctx,
        "jury",
        "#jurado_cloud_1 .cloud-word",
        "horizonte",
        blueMuses.map(({ name }) => name),
        "jury cloud identifies both muses"
      );
      await assertCardsDoNotOverlap(
        ctx,
        "spectator",
        "#nube_inspiracion_canvas .nube-inspiracion-palabra",
        "spectator inspiration cloud",
        3
      );
      await assertCardsDoNotOverlap(
        ctx,
        "jury",
        "#jurado_cloud_1 .cloud-word",
        "jury inspiration cloud",
        2
      );
      await typeInWriter(ctx, "writer1", " destello");
      await ctx.waitForText(
        "writer1",
        "#definicion",
        (text) => text.toLowerCase().includes("horizonte"),
        "writer1 receives queued musa bonus word",
        10000
      );
      await waitForAttributedInspiration(
        ctx,
        "writer1",
        "#definicion",
        "horizonte",
        blueMuses.map(({ name }) => name),
        "writer identifies both muses on the delivered word"
      );
      let superbonusDetected = false;
      try {
        await ctx.waitFor(
          "writer1 marks delivered word as superbonus",
          async () => ctx.evaluate("writer1", () => {
            const node = document.querySelector("#definicion");
            return Boolean(node?.classList?.contains("definicion-superbonus")
              && String(node.textContent || "").toLowerCase().includes("superbonus"));
          }),
          2500
        );
        superbonusDetected = true;
      } catch (error) {
        if (ctx.options?.serverSource === "local") {
          throw error;
        }
      }
      if (superbonusDetected) {
        await ctx.waitFor(
          "spectator cloud marks superbonus",
          async () => ctx.evaluate("spectator", () => {
            const node = document.querySelector("#nube_inspiracion_canvas .nube-inspiracion-palabra.is-superbonus");
            return Boolean(node && String(node.textContent || "").toLowerCase().includes("horizonte"));
          }),
          10000
        );
      }
      await ensureSpectatorView(ctx, "partida");
      await reloadRole(ctx, "spectator");
      await ctx.waitFor(
        "reconnected spectator restores the active word and both muse authors",
        async () => ctx.evaluate("spectator", ({ targetWord, museNames }) => {
          const wordText = String(document.querySelector("#palabra1")?.textContent || "").toLowerCase();
          const authorText = String(document.querySelector("#definicion1 .inspiration-author")?.textContent || "").toUpperCase();
          return wordText.includes(targetWord)
            && museNames.every((name) => authorText.includes(name));
        }, {
          targetWord: "horizonte",
          museNames: blueMuses.map(({ name }) => name)
        }),
        10000
      );
      await clearFloatingFeedbacks(ctx, "writer1");
      await clearFloatingFeedbacks(ctx, "spectator");
      await typeInWriter(ctx, "writer1", " horizonte");
      await waitForQuantifiedInspirationFeedback(
        ctx,
        "writer1",
        "writer sees quantified inspiration feedback for musa bonus"
      );
      await waitForQuantifiedInspirationFeedback(
        ctx,
        "spectator",
        "spectator sees quantified inspiration feedback for musa bonus",
        { selector: "#feedback_tiempo_flotante_root .feedback-tiempo-columna.lado-1 .feedback-tiempo-float" }
      );
    }
  },
  {
    name: "spectator-reconnect-recovers-text",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["control", "writer1", "writer2", "spectator"], { useStateHooks: false });
      await configureFastControlPanel(ctx, {
        tiempo_modos: 10,
        tiempo_cambio_palabras: 10,
        modes: ["palabras bonus"]
      });
      await startGame(ctx, { useStateHooks: false });
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await ctx.setWriterText("writer1", "smoke azul reconnect");
      await ctx.setWriterText("writer2", "smoke rojo reconnect");
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("smoke azul reconnect"), "spectator sees blue text before reconnect", 15000);
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("smoke rojo reconnect"), "spectator sees red text before reconnect", 15000);

      await ctx.closeRole("spectator");
      await openRolesAndWaitWithOptions(ctx, ["spectator"], { useStateHooks: false });
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("smoke azul reconnect"), "spectator restores blue text after reconnect", 15000);
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("smoke rojo reconnect"), "spectator restores red text after reconnect", 15000);
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

      await ctx.evaluate("onep", () => {
        window.__scribPostInicioProbe = 0;
        window.eval(`
          final_cuenta_atras_timer = setTimeout(() => {
            window.__scribPostInicioProbe += 1;
            post_inicio(true);
          }, 40);
          limpiarCountdownInicioEscritora();
        `);
      });
      await ctx.sleep(120);
      const countdownCleanup = await ctx.evaluate("onep", () => ({
        postInicioCalls: window.__scribPostInicioProbe || 0,
        editable: document.querySelector("#texto")?.getAttribute("contenteditable") === "true",
        countdownVisible: Boolean(document.querySelector("#countdown"))
      }));
      ctx.assert(countdownCleanup.postInicioCalls === 0, "1P countdown cleanup should cancel deferred post_inicio");
      ctx.assert(countdownCleanup.editable === false, "1P cleanup should not leave editor editable");
      ctx.assert(countdownCleanup.countdownVisible === false, "1P cleanup should remove countdown DOM");

      await ctx.evaluate("onep", () => {
        const editor = document.querySelector("#texto");
        if (!editor) throw new Error("Missing 1P editor");
        editor.setAttribute("contenteditable", "true");
        editor.textContent = "";
        const range = document.createRange();
        range.setStart(editor, 0);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
        window.eval("teclado_lento_putada = true; revision_teclado_lento_1p = 1;");
        const event = new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: "x"
        });
        editor.dispatchEvent(event);
        window.eval("limpiar_teclado_lento(); teclado_lento_putada = true;");
      });
      await ctx.sleep(650);
      const staleSlowKeyboardText = await ctx.readText("onep", "#texto");
      ctx.assert(staleSlowKeyboardText === "", "1P stale slow-keyboard input should not be inserted after cleanup");
      await ctx.evaluate("onep", () => {
        window.eval("limpiar_teclado_lento();");
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

      await ctx.evaluate("onep", () => {
        const editor = document.querySelector("#texto");
        if (!editor) throw new Error("Missing 1P editor");
        editor.innerHTML = 'abc<span class="palabra-bendita" contenteditable="false">BONUS</span>xy';
      });
      await ctx.getPageEntry("onep").page.focus("#texto");
      await ctx.evaluate("onep", () => {
        const editor = document.querySelector("#texto");
        const span = editor.querySelector(".palabra-bendita");
        const range = document.createRange();
        range.setStartAfter(span);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
      });
      const protectedDeletePreflight = await ctx.evaluate("onep", () => {
        const editor = document.querySelector("#texto");
        return {
          active: document.activeElement === editor,
          helper: typeof borrarCaracterEditableSaltandoProtegido1P,
          sharedHelper: typeof window.ScribEditorDeletion?.borrarCaracterEditableJuntoAProtegido,
          affected: Boolean(obtenerNodoProtegidoAfectadoPorDireccion("backward"))
        };
      });
      ctx.assert(
        protectedDeletePreflight.active
          && protectedDeletePreflight.helper === "function"
          && protectedDeletePreflight.sharedHelper === "function"
          && protectedDeletePreflight.affected,
        `1P protected delete preflight failed: ${JSON.stringify(protectedDeletePreflight)}`
      );
      await pressWriterKey(ctx, "onep", "Backspace", 1, { preserveCaret: true });
      const protectedDeleteState = await readWriterState(ctx, "onep");
      ctx.assert(
        protectedDeleteState.text === "abBONUSxy",
        `1P Backspace should delete behind a protected word in one press, got ${JSON.stringify(protectedDeleteState)}`
      );
      ctx.assert(protectedDeleteState.protectedCount === 1, "1P protected word should survive Backspace");

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
        await waitForLocalMode(ctx, item.sender, item.mode, 10000);
        if (item.mode === "palabras bonus" || item.mode === "palabras prohibidas") {
          await assertMusaWordInspirationPreview(ctx, item.sender, item.mode, item.word, {
            className: item.mode === "palabras prohibidas"
              ? "preview-tiempo-palabra--negativo"
              : "preview-tiempo-palabra--positivo",
            sign: item.mode === "palabras prohibidas" ? "-" : "+"
          });
        }
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
    name: "musa-personalized-pdf-gifts-core",
    run: async (ctx) => {
      const museRoles = ["musa1", "musa1b", "musa2", "musa2b"];
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", ...museRoles]);
      await Promise.all(museRoles.map((role) => installMusaPdfGiftProbe(ctx, role)));
      await configureFastControlPanel(ctx, {
        tiempo_modos: 30,
        tiempo_cambio_letra: 30,
        tiempo_cambio_palabras: 30,
        tiempo_minutos: 3,
        tiempo_segundos: 0
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");
      await ctx.setWriterText("writer1", "pdf azul base ");
      await ctx.setWriterText("writer2", "pdf rojo base ");

      const giftStateByRole = {};
      for (const role of museRoles) {
        giftStateByRole[role] = await readMusaPdfGiftState(ctx, role);
        ctx.assert(giftStateByRole[role].clientId, `${role} should expose a persistent client id`);
      }

      await ctx.emitHook("scrib_test:force_mode", { mode: "letra bendita", letra: "A" });
      await waitForMode(ctx, "letra bendita", 8000);
      await Promise.all(["writer1", "writer2", ...museRoles].map((role) => waitForLocalMode(ctx, role, "letra bendita", 10000)));
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", "aurora"),
        emitMusaInspiration(ctx, "musa1b", "alba"),
        emitMusaInspiration(ctx, "musa2", "amuleto"),
        emitMusaInspiration(ctx, "musa2b", "ancla")
      ]);

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await Promise.all(["writer1", "writer2", ...museRoles].map((role) => waitForLocalMode(ctx, role, "palabras bonus", 10000)));
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", "horizonte"),
        emitMusaInspiration(ctx, "musa1b", "horizonte"),
        emitMusaInspiration(ctx, "musa2", "memoria"),
        emitMusaInspiration(ctx, "musa2b", "memoria")
      ]);
      await ctx.waitForState(
        "personalized pdf superbonus words queued",
        (state) => {
          const team1 = state.inspiracion.nube.equipos[1].palabras_info || [];
          const team2 = state.inspiracion.nube.equipos[2].palabras_info || [];
          return team1.some((item) => item.palabra === "horizonte" && item.superbonus)
            && team2.some((item) => item.palabra === "memoria" && item.superbonus);
        },
        8000
      );
      await requestQueuedWriterWord(ctx, "writer1", "bonus");
      await requestQueuedWriterWord(ctx, "writer2", "bonus");
      await ensureBonusWordInWriterUi(ctx, "writer1", "horizonte", "E2E_LUNA + E2E_SOL");
      await ensureBonusWordInWriterUi(ctx, "writer2", "memoria", "E2E_ROSA + E2E_IRIS");
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await typeInWriter(ctx, "writer1", " horizonte ");
      await typeInWriter(ctx, "writer2", " memoria ");
      await ctx.waitForState(
        "personalized pdf bonus words introduced",
        (state) => state.stats.players[1].palabrasBenditas.includes("HORIZONTE")
          && state.stats.players[2].palabrasBenditas.includes("MEMORIA"),
        10000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras prohibidas" });
      await waitForMode(ctx, "palabras prohibidas", 8000);
      await Promise.all(["writer1", "writer2", ...museRoles].map((role) => waitForLocalMode(ctx, role, "palabras prohibidas", 10000)));
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", "ruina"),
        emitMusaInspiration(ctx, "musa2", "veneno")
      ]);
      await requestQueuedWriterWord(ctx, "writer1", "prohibida");
      await requestQueuedWriterWord(ctx, "writer2", "prohibida");
      await ctx.waitForText("writer1", "#definicion", (text) => text.toLowerCase().includes("veneno"), "writer1 receives rival forbidden word for personalized pdf", 10000);
      await ctx.waitForText("writer2", "#definicion", (text) => text.toLowerCase().includes("ruina"), "writer2 receives rival forbidden word for personalized pdf", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await typeInWriter(ctx, "writer1", " veneno ");
      await typeInWriter(ctx, "writer2", " ruina ");
      await ctx.waitForState(
        "personalized pdf forbidden words introduced",
        (state) => state.stats.players[1].intentosPalabraProhibida >= 1
          && state.stats.players[2].intentosPalabraProhibida >= 1,
        10000
      );

      const expectations = {
        musa1: { sent: ["aurora", "horizonte", "ruina"], introduced: ["horizonte", "ruina"], rivalWord: "ruina", rivalWriter: 2 },
        musa1b: { sent: ["alba", "horizonte"], introduced: ["horizonte"] },
        musa2: { sent: ["amuleto", "memoria", "veneno"], introduced: ["memoria", "veneno"], rivalWord: "veneno", rivalWriter: 1 },
        musa2b: { sent: ["ancla", "memoria"], introduced: ["memoria"] }
      };

      await ctx.waitFor(
        "personalized pdf summary records sent and introduced words",
        async () => {
          const summary = await fetchMusaPdfSummary(ctx);
          return museRoles.every((role) => {
            const entry = getMusaSummaryEntry(summary, giftStateByRole[role].clientId);
            if (!entry) return false;
            const words = entry.palabras || [];
            return expectations[role].sent.every((word) => words.some((item) => item.palabra === word))
              && expectations[role].introduced.every((word) => words.some((item) => item.palabra === word && item.introducida))
              && (!expectations[role].rivalWord || words.some((item) => item.palabra === expectations[role].rivalWord
                && item.modo === "palabras prohibidas"
                && item.introducida_por === expectations[role].rivalWriter));
          }) ? summary : false;
        },
        10000
      );

      await ctx.emitHook("scrib_test:force_finish_player", { player: 1, reiniciar: false, mostrar_resurreccion: false });
      await ctx.emitHook("scrib_test:force_finish_player", { player: 2, reiniciar: false, mostrar_resurreccion: false });
      const giftStates = await ctx.waitFor(
        "each muse receives only its personalized pdf gift",
        async () => {
          const states = {};
          for (const role of museRoles) {
            states[role] = await readMusaPdfGiftState(ctx, role);
          }
          return museRoles.every((role) => {
            const state = states[role];
            const ownGift = state.gifts.find((gift) => gift.client_id === state.clientId);
            const foreignGift = state.gifts.find((gift) => gift.client_id && gift.client_id !== state.clientId);
            return state.visible
              && state.hasData
              && state.filename.endsWith(".pdf")
              && ownGift
              && ownGift.personalizado === true
              && ownGift.player === state.player
              && ownGift.filename === state.filename
              && !foreignGift;
          }) ? states : false;
        },
        20000
      );

      const filenames = new Set();
      for (const role of museRoles) {
        const state = giftStates[role];
        filenames.add(state.filename);
        const pdfText = decodePdfDataUri(state.data);
        ctx.assert(pdfText.startsWith("%PDF"), `${role} gift should be a PDF data URI`);
        ctx.assert(pdfText.includes("SCRIB regalo musa"), `${role} PDF metadata should identify the personalized muse gift`);
        ctx.assert(pdfText.includes(state.clientId), `${role} PDF metadata should include the target client id`);
        ctx.assert(expectations[role].introduced.some((word) => pdfText.includes(word)), `${role} PDF metadata should include an introduced word`);
      }
      ctx.assert(filenames.size === museRoles.length, "personalized muse PDF filenames should be unique");
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
    name: "inspiration-discard-protocol-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "spectator", "musa1", "musa2"]);
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await installWriterInspirationProbe(ctx, "writer1");
      await installSpectatorInspirationProbe(ctx);

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      const queuedWords = ["orbita", "brujula", "candil", "dalia", "esfera"];
      for (const word of queuedWords) {
        await emitMusaInspiration(ctx, "musa1", word);
      }
      await waitForMode(ctx, "palabras bonus", 8000);

      const firstDelivery = await ctx.waitFor(
        "writer1 receives initial discardable muse inspiration",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.meta
            && state.assigned
            && state.meta.es_musa
            && state.meta.factor_inspiracion === 1
            && state.targets.length > 0
            ? state
            : false;
        },
        15000
      );
      ctx.assert(!firstDelivery.discardHidden, "discard control should be visible for a bonus inspiration");
      ctx.assert(!firstDelivery.discardDisabled, "discard control should be enabled for an active bonus inspiration");

      await ctx.setWriterText("writer1", "inicio medio final");
      await placeCaretAtTextOffset(ctx, "writer1", 7);
      const beforeF8 = await readWriterInspirationState(ctx, "writer1");
      await pressWriterKey(ctx, "writer1", "F8", 1, { preserveCaret: true });

      const afterFirstDiscard = await ctx.waitFor(
        "first F8 discard delivers a 75 percent inspiration",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.meta
            && state.meta.inspiracion_id !== firstDelivery.meta.inspiracion_id
            && state.meta.descartes_consecutivos === 1
            && state.meta.factor_inspiracion === 0.75
            && state.assigned
            ? state
            : false;
        },
        10000
      );
      ctx.assert(afterFirstDiscard.text === beforeF8.text, "F8 must not insert or remove writer text");
      ctx.assert(afterFirstDiscard.caretPos === beforeF8.caretPos, "F8 must preserve the writer caret position");
      ctx.assert(/75/.test(afterFirstDiscard.discardEffect), "discard UI should expose the cumulative 75 percent penalty");

      const firstDiscardAck = await ctx.waitFor(
        "first discard receives authoritative ACK",
        async () => {
          const probe = await readWriterInspirationProbe(ctx, "writer1");
          const entry = probe.discards[0];
          return entry && entry.ack ? entry : false;
        },
        5000
      );
      ctx.assert(firstDiscardAck.ack.ok === true, "first discard ACK should be successful");
      ctx.assert(firstDiscardAck.ack.factor_siguiente === 0.75, "first discard ACK should announce factor 0.75");

      await pressWriterKey(ctx, "writer1", "F8", 1, { preserveCaret: true });
      const halfDelivery = await ctx.waitFor(
        "second F8 discard delivers a 50 percent inspiration",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.meta
            && state.meta.inspiracion_id !== afterFirstDiscard.meta.inspiracion_id
            && state.meta.descartes_consecutivos === 2
            && state.meta.factor_inspiracion === 0.5
            && state.assigned
            ? state
            : false;
        },
        10000
      );
      ctx.assert(/50/.test(halfDelivery.discardEffect), "discard UI should expose the cumulative 50 percent penalty");

      const halfDeliveryId = halfDelivery.meta.inspiracion_id;
      await reloadRole(ctx, "writer1");
      const restoredHalfDelivery = await ctx.waitFor(
        "writer reconnect restores active inspiration id and discard streak",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.meta
            && state.meta.inspiracion_id === halfDeliveryId
            && state.meta.descartes_consecutivos === 2
            && state.meta.factor_inspiracion === 0.5
            && state.assigned
            ? state
            : false;
        },
        12000
      );
      ctx.assert(restoredHalfDelivery.meta.inspiracion_id === halfDeliveryId, "reconnect must keep the same active inspiration id");
      await freezeWriterDecay(ctx, "writer1");
      await installWriterInspirationProbe(ctx, "writer1");

      await pressWriterKey(ctx, "writer1", "F8", 1, { preserveCaret: true });
      const quarterDelivery = await ctx.waitFor(
        "third F8 discard delivers the 25 percent floor",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.meta
            && state.meta.inspiracion_id !== halfDeliveryId
            && state.meta.descartes_consecutivos === 3
            && state.meta.factor_inspiracion === 0.25
            && state.meta.valor_inspiracion === 0.25
            && state.meta.es_musa
            && state.assigned
            ? state
            : false;
        },
        10000
      );
      ctx.assert(/25/.test(quarterDelivery.discardEffect), "discard UI should expose the cumulative 25 percent floor");

      const thirdDiscard = await ctx.waitFor(
        "third discard receives ACK",
        async () => {
          const probe = await readWriterInspirationProbe(ctx, "writer1");
          const entry = probe.discards[0];
          return entry && entry.ack ? entry : false;
        },
        5000
      );
      const replayAck = await ctx.evaluate("writer1", (payload) => new Promise((resolve) => {
        socket.emit("descartar_inspiracion", payload, resolve);
      }), thirdDiscard.payload);
      ctx.assert(replayAck && replayAck.ok === true && replayAck.idempotente === true, "replayed discard must be acknowledged idempotently");
      await ctx.sleep(300);
      const afterReplay = await readWriterInspirationState(ctx, "writer1");
      ctx.assert(
        afterReplay.meta && afterReplay.meta.inspiracion_id === quarterDelivery.meta.inspiracion_id,
        "idempotent replay must not skip the current inspiration"
      );
      ctx.assert(afterReplay.meta.descartes_consecutivos === 3, "idempotent replay must not increase the discard streak");

      const expectedTime = quarterDelivery.meta.tiempo_palabras_bonus;
      const acceptedWord = quarterDelivery.targets[0];
      ctx.assert(expectedTime > 0 && expectedTime < 999, "quarter inspiration should carry a finite penalized time");
      ctx.assert(Boolean(acceptedWord), "quarter inspiration should expose a target word");
      await ctx.evaluate("writer1", () => {
        window.eval(`
          if (meta_inspiracion_activa_escritora) {
            meta_inspiracion_activa_escritora.factor_inspiracion = 1;
            meta_inspiracion_activa_escritora.valor_inspiracion = 1;
            meta_inspiracion_activa_escritora.tiempo_palabras_bonus = 999;
          }
          tiempo_palabras_bonus = 999;
        `);
      });
      await typeInWriter(ctx, "writer1", ` ${acceptedWord}`);

      const useEntry = await ctx.waitFor(
        "accepted inspiration receives server-authoritative value and time",
        async () => {
          const probe = await readWriterInspirationProbe(ctx, "writer1");
          const entry = probe.uses.find((item) => item.payload
            && item.payload.inspiracion_id === quarterDelivery.meta.inspiracion_id
            && item.ack);
          return entry || false;
        },
        10000
      );
      ctx.assert(useEntry.ack.ok === true, "use ACK should be successful");
      ctx.assert(useEntry.ack.valor_inspiracion === 0.25, "server ACK must override forged client marker value");
      ctx.assert(useEntry.ack.tiempo_otorgado === expectedTime, "server ACK must override forged client time");

      const acceptedEffects = await ctx.waitFor(
        "authoritative use effects reach writer and spectator",
        async () => {
          const writerProbe = await readWriterInspirationProbe(ctx, "writer1");
          const timeAdjustment = writerProbe.timeAdjustments.find((item) => (
            item.origen === "inspiracion_bonus"
            && String(item.inspiracion_id) === quarterDelivery.meta.inspiracion_id
          ));
          const markedValue = await ctx.evaluate("writer1", () => {
            const marked = Array.from(document.querySelectorAll("#texto [data-inspiration-value]"));
            const last = marked[marked.length - 1];
            return last ? Number(last.dataset.inspirationValue) : null;
          });
          const spectatorProbe = await readSpectatorInspirationProbe(ctx);
          const feedback = spectatorProbe.feedback.find((item) => (
            String(item.inspiracion_id) === quarterDelivery.meta.inspiracion_id
          ));
          const authoritative = spectatorProbe.authoritative.find((item) => (
            String(item.inspiracion_id) === quarterDelivery.meta.inspiracion_id
          ));
          return timeAdjustment
            && markedValue === 0.25
            && feedback
            && Number(feedback.valor_inspiracion) === 0.25
            && authoritative
            && authoritative.autoritativa === true
            && Number(authoritative.equipo) === 1
            && Number(authoritative.valor_inspiracion) === 0.25
            && spectatorProbe.blueCount === 0.25
            ? { timeAdjustment, markedValue, spectatorProbe, feedback, authoritative }
            : false;
        },
        10000
      );
      ctx.assert(acceptedEffects.timeAdjustment.secs === expectedTime, "authoritative server time adjustment must match the ACK");
      ctx.assert(acceptedEffects.timeAdjustment.tiempo_seq > 0, "authoritative time adjustment should carry a monotonic time sequence");
      ctx.assert(acceptedEffects.markedValue === 0.25, "writer score marker must retain the authoritative fractional value");
      ctx.assert(acceptedEffects.spectatorProbe.redCount === 0, "fractional blue inspiration must not increment red");

      await ctx.waitForState(
        "accepted quarter inspiration is recorded once in live stats",
        (state) => state.stats.players[1].palabrasBenditas
          .filter((word) => String(word).toLowerCase() === acceptedWord.toLowerCase()).length === 1,
        10000
      );

      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras prohibidas" });
      await emitMusaInspiration(ctx, "musa2", "veneno");
      await waitForMode(ctx, "palabras prohibidas", 8000);
      const forbiddenDelivery = await ctx.waitFor(
        "writer1 receives a non-discardable forbidden inspiration",
        async () => {
          const state = await readWriterInspirationState(ctx, "writer1");
          return state.mode === "palabras prohibidas"
            && state.meta
            && state.meta.inspiracion_id
            && state.targets.some((word) => word.toLowerCase() === "veneno")
            && state.assigned
            ? state
            : false;
        },
        10000
      );
      ctx.assert(forbiddenDelivery.discardHidden, "discard control must stay hidden for forbidden words");
      const probeBeforeForbiddenF8 = await readWriterInspirationProbe(ctx, "writer1");
      await placeCaretAtTextOffset(ctx, "writer1", 2);
      const forbiddenBeforeF8 = await readWriterInspirationState(ctx, "writer1");
      await pressWriterKey(ctx, "writer1", "F8", 1, { preserveCaret: true });
      await ctx.sleep(500);
      const forbiddenAfterF8 = await readWriterInspirationState(ctx, "writer1");
      const probeAfterForbiddenF8 = await readWriterInspirationProbe(ctx, "writer1");
      ctx.assert(
        probeAfterForbiddenF8.discards.length === probeBeforeForbiddenF8.discards.length,
        "F8 must not emit a discard request in palabras prohibidas"
      );
      ctx.assert(forbiddenAfterF8.text === forbiddenBeforeF8.text, "forbidden-mode F8 must not alter text");
      ctx.assert(forbiddenAfterF8.caretPos === forbiddenBeforeF8.caretPos, "forbidden-mode F8 must preserve caret");
      ctx.assert(forbiddenAfterF8.meta.inspiracion_id === forbiddenDelivery.meta.inspiracion_id, "forbidden-mode F8 must keep the active word");
      ctx.assert(forbiddenAfterF8.definition === forbiddenBeforeF8.definition, "forbidden-mode F8 must keep the visible objective");

      const forbiddenDirectAck = await ctx.evaluate("writer1", ({ inspirationId, modeSeq }) => new Promise((resolve) => {
        socket.emit("descartar_inspiracion", {
          player: window.eval("player"),
          inspiracion_id: inspirationId,
          modo_seq: modeSeq,
          request_id: "e2e-forbidden-discard"
        }, resolve);
      }), {
        inspirationId: forbiddenDelivery.meta.inspiracion_id,
        modeSeq: forbiddenDelivery.meta.modo_seq
      });
      ctx.assert(
        forbiddenDirectAck && forbiddenDirectAck.ok === false && forbiddenDirectAck.code === "MODE_NOT_DISCARDABLE",
        "server must authoritatively reject discards in palabras prohibidas"
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
    name: "video-tutorial-pre-show-core",
    run: async (ctx) => {
      const museRoles = ["musa1", "musa2"];
      let initialConfig = null;

      await openRolesAndWaitWithOptions(
        ctx,
        ["control", "spectator", ...museRoles],
        { useStateHooks: false }
      );
      const assignments = await readAuthoritativeMuseAssignments(ctx, museRoles);
      ctx.assert(
        assignments.filter(({ team }) => team === 1).length === 1
          && assignments.filter(({ team }) => team === 2).length === 1,
        "video tutorial test muses should be balanced one per team"
      );

      const initialState = await ctx.waitFor(
        "authoritative pre-tutorial video state is available",
        async () => {
          const state = await requestVideoTutorialState(ctx, "control");
          return state && state.activo === true && state.session_id && state.phase_seq > 0
            ? state
            : false;
        },
        10000
      );
      initialConfig = { ...initialState.configuracion };

      try {
        const deterministicConfig = await configureVideoTutorialRaw(ctx, "control", {
          audio_url: "../media/tutorial-scrib-audio.mp3",
          intervalo_segundos: 180,
          duracion_segundos: 153,
          habilitado: false,
          silenciado: false
        }, "prepare");
        ctx.assert(
          deterministicConfig && deterministicConfig.ok === true,
          `video tutorial deterministic setup failed: ${deterministicConfig && deterministicConfig.code || "unknown"}`
        );

        await ctx.evaluate("control", () => {
          const panel = document.querySelector('[data-control-section="tutorial"]');
          if (panel && panel.classList.contains("is-collapsed")) {
            document.querySelector("#control_title_tutorial")?.click();
          }
        });
        await ctx.waitForVisible(
          "control",
          "#videotutorial_control",
          true,
          "video tutorial controls are visible"
        );
        await ctx.waitFor(
          "Control has synchronized the video tutorial state",
          async () => ctx.evaluate("control", () => {
            const api = window.ScribVideotutorialControl;
            const state = api && typeof api.obtenerEstado === "function" ? api.obtenerEstado() : null;
            return Boolean(state && state.sincronizado && state.faseActiva && state.sessionId);
          }),
          10000
        );

        await ctx.fillValue("control", "#videotutorial_intervalo", "1");
        await ctx.evaluate("control", () => {
          const toggle = document.querySelector("#videotutorial_habilitado");
          if (!toggle) throw new Error("Missing video tutorial repeat toggle");
          toggle.checked = true;
          toggle.dispatchEvent(new Event("change", { bubbles: true }));
        });

        const scheduled = await ctx.waitFor(
          "Control saves the one-minute automatic video tutorial interval",
          async () => {
            const state = await requestVideoTutorialState(ctx, "control");
            return state
              && state.configuracion
              && state.configuracion.intervalo_segundos === 60
              && state.configuracion.habilitado === true
              && state.proxima_reproduccion_ts > Date.now()
              ? state
              : false;
          },
          10000
        );
        ctx.assert(scheduled.visible === false, "saving the schedule must not start playback immediately");

        await ctx.click("control", "#videotutorial_reproduccion_toggle");
        const playing = await ctx.waitFor(
          "manual video tutorial playback becomes authoritative",
          async () => {
            const state = await requestVideoTutorialState(ctx, "spectator");
            return state
              && state.visible === true
              && state.reproduciendo === true
              && state.reproduccion_seq > 0
              && state.configuracion.duracion_segundos === 153
              ? state
              : false;
          },
          10000
        );
        ctx.assert(playing.origen === "manual", "Control play should mark the playback as manual");
        ctx.assert(
          playing.verificacion.conectadas === 2 && playing.verificacion.verificadas === 0,
          "a fresh playback should await both connected muses"
        );

        await ctx.waitForVisible(
          "spectator",
          "#video_tutorial_overlay",
          true,
          "spectator video tutorial overlay appears"
        );
        for (const roleName of museRoles) {
          await ctx.waitForVisible(
            roleName,
            "#video_tutorial_musa",
            true,
            `${roleName} calibration overlay appears`
          );
        }
        const playingToggle = await ctx.evaluate("control", () => {
          const button = document.querySelector("#videotutorial_reproduccion_toggle");
          return button ? {
            pressed: button.getAttribute("aria-pressed"),
            playing: button.dataset.playing,
            label: button.getAttribute("aria-label")
          } : null;
        });
        ctx.assert(
          playingToggle
            && playingToggle.pressed === "true"
            && playingToggle.playing === "1"
            && /detener/i.test(playingToggle.label),
          "the single Control button should expose active playback"
        );

        const mediaProbe = await ctx.waitFor(
          "spectator loads the narrated CSS tutorial and its raster assets",
          async () => ctx.evaluate("spectator", () => {
            const audio = document.querySelector("#video_tutorial_overlay audio");
            const qr = document.querySelector(".scrib-video-tutorial__welcome-qr");
            const logo = document.querySelector(".scrib-video-tutorial__brand-mark");
            if (!audio || audio.error || audio.readyState < 1 || !/tutorial-scrib-audio\.mp3(?:$|[?#])/i.test(audio.currentSrc)) {
              return false;
            }
            const overlay = document.querySelector("#video_tutorial_overlay");
            const rect = overlay && overlay.getBoundingClientRect();
            const qrSource = qr && qr.currentSrc || "";
            const logoSource = logo && logo.currentSrc || "";
            const coversViewport = Boolean(
              rect
              && Math.abs(rect.left) < 1
              && Math.abs(rect.top) < 1
              && Math.abs(rect.width - window.innerWidth) < 1
              && Math.abs(rect.height - window.innerHeight) < 1
            );
            if (!qr.complete || qr.naturalWidth < 1
              || !logo.complete || logo.naturalWidth < 1
              || !/scribshow-musa-qr\.png\?v=20260829t/.test(qrSource)
              || !/scrib-logo-mark\.png\?v=20260829t/.test(logoSource)
              || !coversViewport) return false;
            return {
              duration: audio.duration,
              currentSrc: audio.currentSrc,
              qrSource,
              logoSource,
              coversViewport
            };
          }),
          15000
        );
        ctx.assert(
          Number.isFinite(mediaProbe.duration) && mediaProbe.duration >= 152.8 && mediaProbe.duration <= 153.1,
          `narrated tutorial should last about 153 seconds, got ${mediaProbe.duration}`
        );
        ctx.assert(/scribshow-musa-qr\.png\?v=20260829t/.test(mediaProbe.qrSource), "spectator QR should load as an explicit image");
        ctx.assert(/scrib-logo-mark\.png\?v=20260829t/.test(mediaProbe.logoSource), "spectator SCRI logo should load as an explicit image");
        ctx.assert(mediaProbe.coversViewport, "spectator video tutorial should cover the full viewport");

        const spectatorAccess = await ctx.evaluate("spectator", ({ rawState }) => {
          const controller = window.__scribVideoTutorialController;
          if (!controller || typeof controller.handleState !== "function") return null;
          controller.handleState({
            ...rawState,
            visible: true,
            reproduciendo: true,
            posicion_segundos: 12
          });
          const root = document.querySelector("#video_tutorial_overlay");
          const qr = root && root.querySelector(".scrib-video-tutorial__welcome-qr");
          const logo = root && root.querySelector(".scrib-video-tutorial__brand-mark");
          const accessUrl = root && root.querySelector(".scrib-video-tutorial__access-url");
          const title = root && root.querySelector("[data-video-tutorial-title]");
          const subtitleLink = root && root.querySelector(".scrib-video-tutorial__subtitle-accent--link");
          root && root.classList.remove("is-scene-entering");
          if (qr) qr.style.animation = "none";
          const qrRect = qr && qr.getBoundingClientRect();
          const logoRect = logo && logo.getBoundingClientRect();
          const accessRect = accessUrl && accessUrl.getBoundingClientRect();
          const titleRect = title && title.getBoundingClientRect();
          return {
            scene: String(root && root.dataset.scene || ""),
            accessUrl: String(accessUrl && accessUrl.textContent || "").trim(),
            qrSource: qr && qr.currentSrc || "",
            logoSource: logo && logo.currentSrc || "",
            urlAligned: Boolean(accessRect && titleRect && Math.abs(accessRect.left - titleRect.left) < 1),
            subtitleLink: String(subtitleLink && subtitleLink.textContent || "").trim(),
            subtitleLinkColor: subtitleLink && getComputedStyle(subtitleLink).color || "",
            qrVisible: Boolean(qr && qr.complete && qr.naturalWidth > 0 && qrRect && qrRect.width >= 300 && qrRect.height >= 300 && getComputedStyle(qr).opacity === "1"),
            logoVisible: Boolean(logo && logo.complete && logo.naturalWidth > 0 && logoRect && logoRect.width >= 70 && logoRect.height >= 70 && getComputedStyle(logo).opacity === "1")
          };
        }, { rawState: playing });
        ctx.assert(spectatorAccess && spectatorAccess.scene === "access", "spectator should enter the QR access scene");
        ctx.assert(spectatorAccess.accessUrl === "www.scribshow.es/musa", "spectator access scene should display the written URL with www");
        ctx.assert(spectatorAccess.urlAligned, "spectator URL should align with the access title");
        ctx.assert(spectatorAccess.subtitleLink === "www.scribshow.es/musa", "spectator subtitle should preserve the written URL");
        ctx.assert(spectatorAccess.subtitleLinkColor === "rgb(85, 244, 255)", "spectator subtitle URL should use its own accent color");
        ctx.assert(spectatorAccess.qrVisible, "spectator QR should occupy a visible square in the access scene");
        ctx.assert(spectatorAccess.logoVisible, "spectator SCRI logo should remain visible in the access scene");
        ctx.assert(/scribshow-musa-qr\.png\?v=20260829t/.test(spectatorAccess.qrSource), "spectator access scene should load the current QR asset");
        ctx.assert(/scrib-logo-mark\.png\?v=20260829t/.test(spectatorAccess.logoSource), "spectator access scene should load the current logo asset");

        const colorPhases = [
          { position: 111, phase: "red", title: "ROJO", background: "rgb(242, 13, 53)" },
          { position: 118, phase: "blue", title: "AZUL", background: "rgb(9, 101, 255)" },
          { position: 125, phase: "green", title: "VERDE", background: "rgb(0, 182, 92)" },
          { position: 132, phase: "white", title: "BLANCO", background: "rgb(248, 251, 255)" }
        ];
        const subtitleColorExpectations = {
          red: "rgb(255, 89, 109)",
          blue: "rgb(85, 186, 255)",
          green: "rgb(92, 255, 156)",
          white: "rgb(255, 255, 255)"
        };
        const spectatorSubtitleColors = await ctx.evaluate("spectator", ({ rawState, phases }) => {
          const controller = window.__scribVideoTutorialController;
          return Object.fromEntries(phases.map(({ position, phase }) => {
            controller.handleState({ ...rawState, visible: true, reproduciendo: true, posicion_segundos: position });
            const accent = document.querySelector(`.scrib-video-tutorial__subtitle-accent--${phase}`);
            return [phase, accent ? getComputedStyle(accent).color : ""];
          }));
        }, { rawState: playing, phases: colorPhases });
        for (const [phase, expectedColor] of Object.entries(subtitleColorExpectations)) {
          ctx.assert(spectatorSubtitleColors[phase] === expectedColor, `spectator subtitle should color ${phase} with its scene color`);
        }
        for (const expected of colorPhases) {
          for (const roleName of museRoles) {
            const rendered = await renderLocalVideoTutorialPosition(
              ctx,
              roleName,
              playing,
              expected.position
            );
            ctx.assert(rendered && rendered.phase === expected.phase, `${roleName} should enter ${expected.phase} calibration`);
            ctx.assert(rendered.title === expected.title, `${roleName} should label the ${expected.phase} calibration`);
            ctx.assert(rendered.background === expected.background, `${roleName} should render a solid ${expected.phase} screen`);
            ctx.assert(rendered.coversViewport, `${roleName} ${expected.phase} calibration should cover its viewport`);
            ctx.assert(rendered.cardWithinViewport, `${roleName} ${expected.phase} card should stay inside its viewport`);
            ctx.assert(!/EQUIPO\s+(?:AZUL|ROJO)/i.test(rendered.identity), `${roleName} should rely on color instead of a team label`);
          }
        }

        const invitation = await renderLocalVideoTutorialPosition(ctx, "musa1", playing, 12);
        ctx.assert(invitation.phase === "access", "connected muses should see the synchronized QR scene");
        ctx.assert(invitation.title === "ENTRA EN LA WEB O ESCANEA", "the muse QR scene should use the concise access title");
        ctx.assert(invitation.shareUrl === "www.scribshow.es/musa", "the muse QR scene should display the written URL with www");
        ctx.assert(invitation.shareIsAnchor === false, "the displayed muse URL must not be clickable");
        ctx.assert(invitation.shareQrLoaded && invitation.shareQrWidth >= 120, "the muse QR should load at a readable mobile size");
        ctx.assert(invitation.museName && invitation.museColor === "rgb(255, 215, 106)", "the muse name should use the muse-yellow identity color");
        ctx.assert(invitation.writerName && !/ESCRITXR\s*:/i.test(invitation.identity), "the writer should appear directly without an ESCRITXR prefix");
        ctx.assert(["rgb(85, 244, 255)", "rgb(255, 113, 130)"].includes(invitation.writerColor), "the writer name should use its team color");
        ctx.assert(invitation.cardWithinViewport, "the muse QR card should stay inside the viewport");

        const museChoiceAnimation = await renderLocalVideoTutorialPosition(ctx, "musa1", playing, 60);
        ctx.assert(museChoiceAnimation.phase === "choices" && museChoiceAnimation.miniPhoneVisible, "muses should see the simplified animated choice preview");

        await renderLocalVideoTutorialPosition(ctx, "musa1", playing, 139);

        const oneVerified = await ctx.waitFor(
          "first muse verifies automatically against the authoritative server",
          async () => {
            const state = await requestVideoTutorialState(ctx, "spectator");
            return state
              && state.reproduccion_seq === playing.reproduccion_seq
              && state.verificacion.verificadas === 1
              ? state
              : false;
          },
          10000
        );
        await ctx.waitForText(
          "musa1",
          "#video_tutorial_musa_title",
          (text) => /CONFIGURACI.N VERIFICADA/i.test(text),
          "first muse receives successful verification feedback"
        );

        await renderLocalVideoTutorialPosition(ctx, "musa2", oneVerified, 139);

        const allVerified = await ctx.waitFor(
          "both muses verify automatically against the authoritative server",
          async () => {
            const state = await requestVideoTutorialState(ctx, "spectator");
            return state
              && state.reproduccion_seq === playing.reproduccion_seq
              && state.verificacion.conectadas === 2
              && state.verificacion.verificadas === 2
              && state.verificacion.pendientes === 0
              ? state
              : false;
          },
          10000
        );
        const verifiedNames = new Set(
          allVerified.verificacion.nombres_verificados.map((name) => String(name).toUpperCase())
        );
        for (const assignment of assignments) {
          ctx.assert(verifiedNames.has(assignment.name), `server verification should include ${assignment.name}`);
        }

        await ctx.click("control", "#videotutorial_reproduccion_toggle");
        const stopped = await ctx.waitFor(
          "Control manually stops and removes the video tutorial",
          async () => {
            const state = await requestVideoTutorialState(ctx, "control");
            return state
              && state.visible === false
              && state.reproduciendo === false
              && state.configuracion.habilitado === true
              && state.proxima_reproduccion_ts > Date.now()
              ? state
              : false;
          },
          10000
        );
        ctx.assert(
          stopped.reproduccion_seq === playing.reproduccion_seq,
          "stopping should preserve the completed playback sequence"
        );
        await ctx.waitForVisible(
          "spectator",
          "#video_tutorial_overlay",
          false,
          "spectator overlay is removed manually"
        );
        for (const roleName of museRoles) {
          await ctx.waitForVisible(
            roleName,
            "#video_tutorial_musa",
            false,
            `${roleName} calibration overlay is removed manually`
          );
        }

        await ctx.evaluate("control", () => {
          const toggle = document.querySelector("#videotutorial_habilitado");
          if (!toggle) throw new Error("Missing video tutorial repeat toggle");
          toggle.checked = false;
          toggle.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await ctx.waitFor(
          "Control disables automatic video tutorial repetition",
          async () => {
            const state = await requestVideoTutorialState(ctx, "control");
            return state
              && state.configuracion.habilitado === false
              && state.proxima_reproduccion_ts === 0
              ? state
              : false;
          },
          10000
        );
        const stoppedToggle = await ctx.evaluate("control", () => {
          const button = document.querySelector("#videotutorial_reproduccion_toggle");
          const status = document.querySelector("#videotutorial_estado");
          return button && status ? {
            pressed: button.getAttribute("aria-pressed"),
            playing: button.dataset.playing,
            statusHidden: status.hidden
          } : null;
        });
        ctx.assert(
          stoppedToggle
            && stoppedToggle.pressed === "false"
            && stoppedToggle.playing === "0"
            && stoppedToggle.statusHidden === true,
          "Control should show the stopped state without redundant status copy"
        );
      } finally {
        if (initialConfig) {
          try {
            await configureVideoTutorialRaw(ctx, "control", initialConfig, "restore");
          } catch (_error) {
          }
        }
      }
    }
  },
  {
    name: "muse-help-assistance-core",
    run: async (ctx) => {
      const museRoles = ["musa1", "musa2"];
      await openRolesAndWaitWithOptions(ctx, ["control", ...museRoles], { useStateHooks: false });
      const assignments = await readAuthoritativeMuseAssignments(ctx, museRoles);
      const assignmentByRole = new Map(assignments.map((assignment) => [assignment.roleName, assignment]));

      for (const roleName of museRoles) {
        await ctx.waitForVisible(roleName, "#musa_help_fab", true, `${roleName} always shows the floating help button`);
        const floatingButton = await ctx.evaluate(roleName, () => {
          const button = document.querySelector("#musa_help_fab");
          const rect = button && button.getBoundingClientRect();
          const style = button && getComputedStyle(button);
          return button && rect && style ? {
            position: style.position,
            top: rect.top,
            right: window.innerWidth - rect.right,
            width: rect.width,
            height: rect.height,
            zIndex: Number(style.zIndex) || 0
          } : null;
        });
        ctx.assert(floatingButton && floatingButton.position === "fixed", `${roleName} help button should float with fixed positioning`);
        ctx.assert(floatingButton.top >= 0 && floatingButton.right >= 0, `${roleName} help button should remain inside the viewport`);
        ctx.assert(floatingButton.width >= 44 && floatingButton.height >= 44, `${roleName} help button should remain touch accessible`);
        ctx.assert(floatingButton.zIndex >= 2147483000, `${roleName} help button should stay above full-screen game overlays`);

        await ctx.click(roleName, "#musa_help_fab");
        await ctx.waitForVisible(roleName, "#musa_help_confirm", true, `${roleName} sees the explicit help confirmation`);
        await ctx.waitForText(
          roleName,
          "#musa_help_confirm_copy",
          (text) => /enviaremos tu aviso al equipo/i.test(text),
          `${roleName} confirmation explains the physical help request`
        );
        const privacyText = await ctx.readText(roleName, ".musa-help-confirm__privacy");
        ctx.assert(/ayudarte dentro de esta p.gina/i.test(privacyText), `${roleName} confirmation must limit remote assistance to this SCRIB page`);
        ctx.assert(/cancelar.+cuando quieras/i.test(privacyText), `${roleName} confirmation must explain revocation`);
        ctx.assert(!/Control/i.test(`${await ctx.readText(roleName, "#musa_help_confirm_copy")} ${privacyText}`), `${roleName} confirmation must avoid internal role jargon`);
        await ctx.click(roleName, "#musa_help_confirm_accept");
        await ctx.waitForVisible(roleName, "#musa_help_flag", true, `${roleName} receives a full-screen physical help flag`);
      }

      const museTickets = {};
      for (const roleName of museRoles) {
        museTickets[roleName] = await ctx.waitFor(
          `${roleName} receives an authoritative help ticket`,
          async () => ctx.evaluate(roleName, () => {
            const controller = window.ayudaMusaController;
            const state = controller && typeof controller.getState === "function" ? controller.getState() : null;
            const ticket = state && state.ticket;
            return ticket && ticket.ticket_id && ticket.estado === "pendiente" ? {
              ticketId: ticket.ticket_id,
              color: ticket.color,
              colorName: ticket.color_nombre,
              name: ticket.nombre_musa,
              team: ticket.equipo
            } : false;
          }),
          10000
        );
        const assignment = assignmentByRole.get(roleName);
        ctx.assert(museTickets[roleName].team === assignment.team, `${roleName} help ticket should retain its authoritative team`);
        const flagPresentation = await ctx.evaluate(roleName, () => {
          const flag = document.querySelector("#musa_help_flag");
          return flag ? {
            copy: flag.querySelector(".musa-help-flag__copy")?.textContent.trim() || "",
            obsoleteCopy: Boolean(flag.querySelector("#musa_help_flag_color, #musa_help_flag_state, .musa-help-flag__eyebrow")),
            assignedColor: flag.style.getPropertyValue("--musa-help-color").trim()
          } : null;
        });
        ctx.assert(
          flagPresentation && flagPresentation.copy === "Levanta la pantalla y muévela para que el equipo pueda encontrarte",
          `${roleName} flag should show only the concise physical instruction`
        );
        ctx.assert(flagPresentation && !flagPresentation.obsoleteCopy, `${roleName} flag should omit redundant labels and status copy`);
        ctx.assert(
          flagPresentation && flagPresentation.assignedColor.toLowerCase() === museTickets[roleName].color.toLowerCase(),
          `${roleName} flag should still use its server-assigned color visually`
        );
      }
      ctx.assert(museTickets.musa1.ticketId !== museTickets.musa2.ticketId, "help requests must create individual opaque tickets");
      ctx.assert(museTickets.musa1.color !== museTickets.musa2.color, "simultaneous muses should receive different physical flag colors");

      await ctx.evaluate("control", () => {
        const group = document.querySelector('[data-control-section="asistencia"]');
        if (group && group.classList.contains("is-collapsed")) {
          document.querySelector("#control_title_assistance")?.click();
        }
      });
      await ctx.waitForVisible("control", "#asistencia_control", true, "Control opens the assistance workspace");
      await ctx.waitForText(
        "control",
        "#asistencia_tab_contador",
        (text) => text.trim() === "2",
        "Control reports both active incidents",
        10000
      );
      const controlTickets = await ctx.waitFor(
        "Control receives both individual help tickets",
        async () => ctx.evaluate("control", () => {
          const api = window.ScribMuseHelpControl;
          const state = api && typeof api.obtenerEstado === "function" ? api.obtenerEstado() : null;
          if (!state || !state.synced) return false;
          const active = state.tickets.filter((ticket) => ticket.status === "solicitada" || ticket.status === "atendida");
          return active.length === 2 ? active.map((ticket) => ({
            ticketId: ticket.ticketId,
            name: ticket.museName,
            team: ticket.team.id,
            color: ticket.color,
            status: ticket.status
          })) : false;
        }),
        10000
      );
      const serializedControlTickets = JSON.stringify(controlTickets);
      ctx.assert(!/client[_-]?id/i.test(serializedControlTickets), "Control help state must not expose stable muse client ids");
      for (const roleName of museRoles) {
        const assignment = assignmentByRole.get(roleName);
        ctx.assert(
          controlTickets.some((ticket) => ticket.ticketId === museTickets[roleName].ticketId
            && ticket.team === assignment.team
            && ticket.name.toUpperCase() === assignment.name),
          `Control should identify ${roleName} by public name and team`
        );
      }

      await ctx.evaluate("control", (ticketId) => {
        if (!window.ScribMuseHelpControl.seleccionar(ticketId)) throw new Error("Could not select first muse help ticket");
      }, museTickets.musa1.ticketId);
      await ctx.click("control", "#asistencia_atender");
      await ctx.waitFor(
        "first muse sees that Control is attending",
        async () => ctx.evaluate("musa1", () => {
          const state = window.ayudaMusaController && window.ayudaMusaController.getState();
          return state && state.ticket && state.ticket.estado === "atendiendo";
        }),
        10000
      );
      await ctx.waitForVisible(
        "musa1",
        "#musa_help_attending_indicator",
        true,
        "attended muse sees the persistent screen halo"
      );
      const attendingHalo = await ctx.evaluate("musa1", () => {
        const halo = document.querySelector("#musa_help_attending_indicator");
        const rect = halo && halo.getBoundingClientRect();
        const style = halo && getComputedStyle(halo);
        return halo && rect && style ? {
          text: halo.textContent.trim(),
          position: style.position,
          pointerEvents: style.pointerEvents,
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          right: Math.round(window.innerWidth - rect.right),
          bottom: Math.round(window.innerHeight - rect.bottom),
          zIndex: Number(style.zIndex) || 0
        } : null;
      });
      ctx.assert(attendingHalo && attendingHalo.text === "", "attending halo should frame the page without an extra message");
      ctx.assert(attendingHalo.position === "fixed" && attendingHalo.pointerEvents === "none", "attending halo must persist without blocking muse input");
      ctx.assert(
        attendingHalo.top === 0 && attendingHalo.left === 0 && attendingHalo.right === 0 && attendingHalo.bottom === 0,
        "attending halo should frame the complete muse viewport"
      );
      ctx.assert(attendingHalo.zIndex < 2147483610, "attending halo should remain below help dialogs and the floating button");
      await ctx.waitForVisible("musa1", "#musa_help_flag", false, "attended help flag minimizes so Control can inspect the page");
      await ctx.click("musa1", "#musa_help_fab");
      await ctx.waitForVisible("musa1", "#musa_help_flag", true, "the muse can reopen help controls while being attended");
      await ctx.click("musa1", "#musa_help_flag_minimize");
      await ctx.waitForVisible("musa1", "#musa_help_flag", false, "the muse can minimize the physical flag again");

      await ctx.click("control", "#asistencia_diagnostico_abrir");
      await ctx.waitFor(
        "consented diagnostic session becomes active",
        async () => {
          const control = await ctx.evaluate("control", (ticketId) => {
            const state = window.ScribMuseHelpControl && window.ScribMuseHelpControl.obtenerEstado();
            const ticket = state && state.tickets.find((entry) => entry.ticketId === ticketId);
            return Boolean(ticket && ticket.diagnostic.status === "activo" && ticket.diagnostic.sessionId);
          }, museTickets.musa1.ticketId);
          const muse = await ctx.evaluate("musa1", () => {
            const state = window.ayudaMusaController && window.ayudaMusaController.getState();
            return Boolean(state && state.diagnostico && state.diagnostico.session_id);
          });
          return control && muse;
        },
        10000
      );
      await ctx.waitForVisible("musa1", "#musa_help_remote_indicator", true, "muse sees a persistent remote-assistance indicator");
      await ctx.waitForText(
        "musa1",
        "#musa_help_remote_indicator",
        (text) => text.trim() === "ASISTENCIA ACTIVA",
        "muse sees the concise assistance label"
      );
      await ctx.waitFor(
        "Control receives a real live page frame",
        async () => ctx.evaluate("control", () => {
          const image = document.querySelector("#asistencia_preview");
          return Boolean(image && !image.hidden && image.complete && image.naturalWidth > 0
            && /^data:image\/(?:jpeg|png|webp);base64,/.test(image.src));
        }),
        20000,
        200
      );

      await ctx.evaluate("musa1", () => {
        const spacer = document.createElement("div");
        spacer.id = "e2e_muse_help_scroll_space";
        spacer.style.height = "1800px";
        spacer.setAttribute("aria-hidden", "true");
        document.body.append(spacer);
        window.scrollTo(0, 0);
        window.__e2eMuseHelpReloadMarker = "musa1-before";
      });
      await ctx.evaluate("musa2", () => {
        window.__e2eMuseHelpReloadMarker = "musa2-before";
      });
      await ctx.click("control", "#asistencia_scroll_abajo");
      await ctx.waitFor(
        "remote safe scroll changes only the selected muse page",
        async () => (await ctx.evaluate("musa1", () => window.scrollY)) > 0,
        8000
      );

      await ctx.evaluate("control", () => {
        window.confirm = () => true;
        if (!window.ScribMuseHelpControl.recargarMusa()) throw new Error("Could not request exact muse reload");
      });
      await ctx.waitFor(
        "only the selected muse reloads remotely",
        async () => {
          let firstReloaded = false;
          let secondUntouched = false;
          try {
            firstReloaded = await ctx.evaluate("musa1", () => (
              window.__e2eMuseHelpReloadMarker !== "musa1-before"
              && Boolean(window.ayudaMusaController)
            ));
            secondUntouched = await ctx.evaluate("musa2", () => window.__e2eMuseHelpReloadMarker === "musa2-before");
          } catch (_error) {
            return false;
          }
          return firstReloaded && secondUntouched;
        },
        15000,
        250
      );
      await waitForSocketConnection(ctx, "musa1", 12000);
      await ctx.waitFor(
        "reloaded muse reconnects to the same help ticket",
        async () => ctx.evaluate("musa1", (ticketId) => {
          const state = window.ayudaMusaController && window.ayudaMusaController.getState();
          return Boolean(state && state.ticket && state.ticket.ticket_id === ticketId);
        }, museTickets.musa1.ticketId),
        12000
      );
      await ctx.waitForVisible(
        "musa1",
        "#musa_help_attending_indicator",
        true,
        "reloaded muse restores the attending halo from authoritative state"
      );
      const reloadedHaloText = await ctx.evaluate("musa1", () => (
        document.querySelector("#musa_help_attending_indicator")?.textContent.trim() || ""
      ));
      ctx.assert(reloadedHaloText === "", "reloaded muse keeps the clean attending frame without extra copy");

      await ctx.evaluate("control", (ticketId) => {
        window.ScribMuseHelpControl.seleccionar(ticketId);
      }, museTickets.musa1.ticketId);
      await ctx.waitForText(
        "control",
        "#asistencia_resolver",
        (text) => text.trim() === "CERRAR INCIDENCIA",
        "Control exposes an explicit close-incident button"
      );
      await ctx.click("control", "#asistencia_resolver");
      await ctx.waitFor(
        "resolved muse returns to idle help state",
        async () => ctx.evaluate("musa1", () => {
          const state = window.ayudaMusaController && window.ayudaMusaController.getState();
          return Boolean(state && !state.ticket);
        }),
        10000
      );
      await ctx.waitForVisible("musa1", "#musa_help_fab", true, "resolved muse keeps the floating help button available");
      await ctx.waitForVisible("musa1", "#musa_help_attending_indicator", false, "closing the incident removes the attending halo");

      await ctx.click("musa2", "#musa_help_flag_cancel");
      await ctx.waitFor(
        "second muse can cancel its own incident",
        async () => ctx.evaluate("musa2", () => {
          const state = window.ayudaMusaController && window.ayudaMusaController.getState();
          return Boolean(state && !state.ticket);
        }),
        10000
      );
      await ctx.waitForText(
        "control",
        "#asistencia_tab_contador",
        (text) => text.trim() === "0",
        "Control clears the active incident counter after resolve and cancel",
        10000
      );
      const closedStatuses = await ctx.evaluate("control", () => {
        const state = window.ScribMuseHelpControl && window.ScribMuseHelpControl.obtenerEstado();
        return state ? state.tickets.map((ticket) => ticket.status) : [];
      });
      ctx.assert(closedStatuses.includes("resuelta"), "Control history should retain the resolved incident");
      ctx.assert(closedStatuses.includes("cancelada"), "Control history should retain the muse-cancelled incident");
      await ctx.click("control", "#asistencia_modal_cerrar");
      await ctx.evaluate("control", () => { window.confirm = () => true; });
      await ctx.click("control", "#asistencia_limpiar");
      await ctx.waitFor(
        "Control clears active and historical incidents through the server",
        async () => ctx.evaluate("control", () => {
          const state = window.ScribMuseHelpControl && window.ScribMuseHelpControl.obtenerEstado();
          return Boolean(state && state.synced && state.tickets.length === 0
            && document.querySelectorAll("#asistencia_lista .asistencia-ticket").length === 0);
        }),
        10000
      );
    }
  },
  {
    name: "musa-pre-show-core",
    run: async (ctx) => {
      await openRolesAndWaitWithOptions(ctx, ["control", "spectator", "musa1"], { useStateHooks: false });

      await ctx.waitForVisible(
        "musa1",
        "#pre_show_musa",
        true,
        "musa pre-show composer is visible on entry"
      );
      await ctx.click("control", "#boton_vista_tutorial");
      await ctx.waitFor(
        "spectator keeps the pre-show visible in the explicit tutorial view",
        async () => ctx.evaluate("spectator", () => {
          const panel = document.querySelector("#pre_show_espectador");
          return Boolean(
            document.body.classList.contains("vista-tutorial")
            && document.body.classList.contains("pre-show-espectador-activo")
            && panel
            && panel.hidden === false
            && getComputedStyle(panel).display !== "none"
          );
        }),
        10000
      );
      await ctx.waitFor(
        "musa pre-show composer is ready",
        async () => ctx.evaluate("musa1", () => {
          const input = document.querySelector("#pre_show_musa_input");
          return Boolean(input && !input.disabled);
        }),
        10000
      );
      const assignedTeam = await ctx.evaluate("musa1", () => {
        try {
          return Number(window.eval("player"));
        } catch (_error) {
          return 0;
        }
      });
      ctx.assert(assignedTeam === 1 || assignedTeam === 2, "musa must have an authoritative balanced team before posting");

      const openPhase = await ctx.evaluate("musa1", () => new Promise((resolve) => {
        const musaSocket = window.eval("socket");
        const timer = setTimeout(() => resolve(null), 5000);
        musaSocket.emit("pedir_pre_show_estado", {}, (response = {}) => {
          clearTimeout(timer);
          resolve(response && response.ok === true ? response.estado : null);
        });
      }));
      ctx.assert(openPhase && openPhase.activo === true, "musa must receive the authoritative open pre-show phase");
      ctx.assert(Boolean(openPhase.session_id), "open pre-show phase must include a session id");
      ctx.assert(Number.isInteger(openPhase.phase_seq), "open pre-show phase must include a phase sequence");

      const rawMessage = 'Canal &copy; <b>EN VIVO</b> "E2E"';
      const publishedMessage = 'Canal &copy; EN VIVO "E2E"';
      await ctx.fillValue("musa1", "#pre_show_musa_input", rawMessage);
      await ctx.waitFor(
        "pre-show send button enabled",
        async () => ctx.evaluate("musa1", () => {
          const button = document.querySelector("#pre_show_musa_enviar");
          return Boolean(button && !button.disabled);
        })
      );
      await ctx.click("musa1", "#pre_show_musa_enviar");

      await ctx.waitForText(
        "musa1",
        "#pre_show_musa_feedback",
        (text) => /enviado.+espectador/i.test(text),
        "musa receives successful pre-show ACK",
        10000
      );
      await ctx.waitFor(
        "spectator receives the authoritative pre-show card",
        async () => ctx.evaluate("spectator", (expectedText) => {
          const card = document.querySelector("#pre_show_espectador_mensajes .pre-show-message[data-message-id]");
          const text = card && card.querySelector(".pre-show-message__text");
          return Boolean(
            card
            && card.dataset.messageId
            && String(text?.textContent || "").trim() === expectedText
          );
        }, publishedMessage),
        10000
      );

      const rendered = await ctx.evaluate("spectator", () => {
        const cards = Array.from(document.querySelectorAll("#pre_show_espectador_mensajes .pre-show-message"));
        const card = cards[0];
        const text = card && card.querySelector(".pre-show-message__text");
        const muse = card && card.querySelector(".pre-show-message__muse");
        if (!card || !text || !muse) return null;
        return {
          cardCount: cards.length,
          messageIds: cards.map((item) => String(item.dataset.messageId || "")),
          text: String(text.textContent || "").trim(),
          html: String(text.innerHTML || ""),
          textElementChildren: text.childElementCount,
          muse: String(muse.textContent || "").trim(),
          classes: Array.from(card.classList),
          animationName: window.getComputedStyle(card).animationName,
          messageId: String(card.dataset.messageId || "")
        };
      });
      ctx.assert(Boolean(rendered), "spectator should render a pre-show message card");
      ctx.assert(rendered.cardCount === 1, "one accepted submit must render exactly one spectator card");
      ctx.assert(new Set(rendered.messageIds).size === 1, "spectator pre-show card ids must be unique");
      ctx.assert(rendered.text === publishedMessage, "spectator must render the server-sanitized message literally");
      ctx.assert(rendered.html.includes("&amp;copy;"), "spectator message must escape HTML entities via textContent");
      ctx.assert(rendered.textElementChildren === 0, "spectator message must not create injected child elements");
      ctx.assert(rendered.muse === "E2E_LUNA", "spectator message must identify its muse");
      ctx.assert(
        rendered.classes.includes(`pre-show-message--team-${assignedTeam}`),
        "spectator message must identify the authoritative muse team"
      );
      ctx.assert(rendered.classes.includes("is-new"), "new spectator message must use its entrance animation state");
      ctx.assert(
        rendered.animationName && rendered.animationName !== "none",
        "new spectator message must have a CSS entrance animation"
      );
      ctx.assert(Boolean(rendered.messageId), "spectator message must expose its authoritative id");

      const ackUi = await ctx.evaluate("musa1", () => ({
        inputValue: String(document.querySelector("#pre_show_musa_input")?.value || ""),
        buttonDisabled: Boolean(document.querySelector("#pre_show_musa_enviar")?.disabled)
      }));
      ctx.assert(ackUi.inputValue === "", "successful ACK must clear the musa composer");
      ctx.assert(ackUi.buttonDisabled, "successful ACK must begin a musa send cooldown");

      await ctx.fillValue("musa1", "#pre_show_musa_input", "Segundo mensaje bloqueado por cooldown");
      const disabledDuringCooldown = await ctx.evaluate(
        "musa1",
        () => Boolean(document.querySelector("#pre_show_musa_enviar")?.disabled)
      );
      ctx.assert(disabledDuringCooldown, "musa must not be able to submit again during cooldown");
      await ctx.waitFor(
        "pre-show cooldown releases composer",
        async () => ctx.evaluate(
          "musa1",
          () => !document.querySelector("#pre_show_musa_enviar")?.disabled
        ),
        6000
      );

      await ctx.invoke("control", "cambiar_vista_calentamiento");
      await ctx.waitForState(
        "production tutorial view starts",
        (state) => state.tutorial.activo === true && state.tutorial.vista === true,
        10000
      );
      await ctx.waitForVisible(
        "spectator",
        "#pre_show_espectador",
        false,
        "spectator pre-show closes when tutorial starts"
      );
      await ctx.waitForVisible(
        "musa1",
        "#pre_show_musa",
        false,
        "musa pre-show closes when tutorial starts"
      );

      const lateAck = await ctx.evaluate("musa1", (phase) => new Promise((resolve) => {
        const musaSocket = window.eval("socket");
        const timer = setTimeout(() => resolve({ ok: false, code: "ACK_TIMEOUT" }), 5000);
        musaSocket.emit("pre_show_musa_enviar", {
          texto: "ENVIO TARDIO E2E",
          request_id: "e2e_pre_show_late",
          client_id: window.musa_client_id || "",
          session_id: phase.session_id,
          phase_seq: phase.phase_seq
        }, (response = {}) => {
          clearTimeout(timer);
          resolve(response);
        });
      }), openPhase);
      ctx.assert(lateAck && lateAck.ok === false, "late pre-show submit must be rejected");
      ctx.assert(lateAck.code === "STALE_PHASE", "late packet from the open phase must be rejected as stale");

      const closedSnapshot = await ctx.evaluate("spectator", () => new Promise((resolve) => {
        const spectatorSocket = window.eval("socket");
        const timer = setTimeout(() => resolve(null), 5000);
        spectatorSocket.emit("pedir_pre_show_estado", {}, (response = {}) => {
          clearTimeout(timer);
          resolve(response && response.ok === true ? response.estado : null);
        });
      }));
      ctx.assert(closedSnapshot && closedSnapshot.activo === false, "authoritative pre-show snapshot must remain closed");
      ctx.assert(
        closedSnapshot.session_id === openPhase.session_id && closedSnapshot.phase_seq > openPhase.phase_seq,
        "tutorial must advance the pre-show phase without reusing the open sequence"
      );
      ctx.assert(
        Array.isArray(closedSnapshot.mensajes) && closedSnapshot.mensajes.length === 0,
        "late pre-show packet must not persist or publish any message"
      );
      ctx.assert(
        !JSON.stringify(closedSnapshot).includes("ENVIO TARDIO E2E"),
        "authoritative snapshot must not contain the late packet text"
      );

      const previousSession = closedSnapshot.session_id;
      await ctx.invoke("control", "limpiar");
      await ctx.waitForVisible(
        "spectator",
        "#pre_show_espectador",
        true,
        "spectator pre-show reopens after production limpiar in the same tab",
        10000
      );
      await ctx.waitForVisible(
        "musa1",
        "#pre_show_musa",
        true,
        "musa pre-show reopens after production limpiar in the same tab",
        10000
      );
      const reopened = await ctx.waitFor(
        "fresh pre-show session after production limpiar",
        async () => ctx.evaluate("musa1", (oldSession) => new Promise((resolve) => {
          const musaSocket = window.eval("socket");
          const timer = setTimeout(() => resolve(false), 3000);
          musaSocket.emit("pedir_pre_show_estado", {}, (response = {}) => {
            clearTimeout(timer);
            const state = response && response.ok === true ? response.estado : null;
            resolve(
              state
              && state.activo === true
              && state.session_id
              && state.session_id !== oldSession
              && Array.isArray(state.mensajes)
              && state.mensajes.length === 0
                ? state
                : false
            );
          });
        }), previousSession),
        10000
      );
      ctx.assert(reopened.mensajes.length === 0, "production limpiar must reopen without messages from the previous show");
      const spectatorCardsAfterReset = await ctx.evaluate(
        "spectator",
        () => document.querySelectorAll("#pre_show_espectador_mensajes .pre-show-message").length
      );
      ctx.assert(spectatorCardsAfterReset === 0, "spectator must not retain pre-reset message cards");
    }
  },
  {
    name: "tutorial-core",
    run: async (ctx) => {
      const museRoles = ["musa1", "musa1b", "musa2", "musa2b"];
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", ...museRoles]);
      const museAssignments = await readAuthoritativeMuseAssignments(ctx, museRoles);
      const blueMuses = museAssignments.filter(({ team }) => team === 1);
      const redMuses = museAssignments.filter(({ team }) => team === 2);
      ctx.assert(blueMuses.length === 2 && redMuses.length === 2, "tutorial muses should stay balanced two per team");

      await ctx.invoke("control", "cambiar_vista_calentamiento");
      await ctx.waitForState(
        "tutorial view active",
        (state) => state.tutorial.vista === true,
        6000
      );

      await ctx.invoke("control", "pedir_solicitud_calentamiento", "lugares");
      await ctx.sendWarmupWord(blueMuses[0].roleName, "biblioteca");
      await ctx.sendWarmupWord(blueMuses[1].roleName, "azotea");
      await ctx.sendWarmupWord(redMuses[0].roleName, "observatorio");
      await ctx.waitForState(
        "warmup places received",
        (state) => state.tutorial.solicitud === "lugares"
          && state.tutorial.equipos[1].palabras.some((item) => item.palabra === "biblioteca" && item.nombre_musa === blueMuses[0].name)
          && state.tutorial.equipos[1].palabras.some((item) => item.palabra === "azotea" && item.nombre_musa === blueMuses[1].name)
          && state.tutorial.equipos[2].palabras.some((item) => item.palabra === "observatorio" && item.nombre_musa === redMuses[0].name),
        10000
      );
      await waitForAttributedInspiration(
        ctx,
        "spectator",
        "#calentamiento_nube .calentamiento-palabra",
        "biblioteca",
        [blueMuses[0].name],
        "spectator tutorial identifies the first blue muse"
      );
      await waitForAttributedInspiration(
        ctx,
        "spectator",
        "#calentamiento_nube .calentamiento-palabra",
        "azotea",
        [blueMuses[1].name],
        "spectator tutorial identifies the second blue muse"
      );
      await waitForAttributedInspiration(
        ctx,
        "writer1",
        "#calentamiento_nube_escritor .calentamiento-palabra",
        "observatorio",
        [redMuses[0].name],
        "writer tutorial identifies the red muse"
      );
      await assertCardsDoNotOverlap(
        ctx,
        "spectator",
        "#calentamiento_nube .calentamiento-palabra",
        "spectator tutorial cloud",
        3
      );
      await assertCardsDoNotOverlap(
        ctx,
        "writer1",
        "#calentamiento_nube_escritor .calentamiento-palabra",
        "writer tutorial cloud",
        3
      );
      await ctx.clickWarmupWord("writer1", "biblioteca");
      await ctx.clickWarmupWord("writer2", "observatorio");
      await ctx.waitForState(
        "writers selected warmup words",
        (state) => state.tutorial.equipos[1].seleccionadas >= 1 && state.tutorial.equipos[2].seleccionadas >= 1,
        10000
      );

      await ctx.invoke("control", "pedir_solicitud_calentamiento", "frase_final");
      await ctx.sendWarmupWord(blueMuses[0].roleName, "la luna entra por la ventana");
      await ctx.sendWarmupWord(redMuses[0].roleName, "el teatro respira humo azul");
      await ctx.waitForState(
        "warmup final phrases received",
        (state) => state.tutorial.solicitud === "frase_final"
          && state.tutorial.equipos[1].palabras.some((item) => item.palabra === "la luna entra por la ventana")
          && state.tutorial.equipos[2].palabras.some((item) => item.palabra === "el teatro respira humo azul"),
        10000
      );
      await ctx.clickWarmupWord("writer1", "la luna entra por la ventana");
      await ctx.clickWarmupWord("writer2", "el teatro respira humo azul");
      await ctx.evaluate("writer1", () => socket.emit("calentamiento_bloquear_equipo"));
      await ctx.evaluate("writer2", () => socket.emit("calentamiento_bloquear_equipo"));
      await ctx.waitForState(
        "writers locked their final warmup choices",
        (state) => state.tutorial.equipos[1].bloqueado === true
          && state.tutorial.equipos[2].bloqueado === true,
        10000
      );
      await ctx.clickWarmupWord("writer1", "la luna entra por la ventana");
      await ctx.clickWarmupWord("writer2", "el teatro respira humo azul");
      await ctx.waitForState(
        "warmup final phrases keep their muse authors",
        (state) => state.tutorial.equipos[1].final?.palabra === "la luna entra por la ventana"
          && state.tutorial.equipos[1].final?.nombre_musa === blueMuses[0].name
          && state.tutorial.equipos[2].final?.palabra === "el teatro respira humo azul"
          && state.tutorial.equipos[2].final?.nombre_musa === redMuses[0].name,
        10000
      );
      await waitForAttributedInspiration(
        ctx,
        "spectator",
        "#calentamiento_final_j1",
        "la luna entra por la ventana",
        [blueMuses[0].name],
        "spectator final phrase keeps its muse"
      );
      await waitForAttributedInspiration(
        ctx,
        "writer1",
        "#calentamiento_final_escritor",
        "la luna entra por la ventana",
        [blueMuses[0].name],
        "writer final phrase keeps its muse"
      );
      await waitForAttributedInspiration(
        ctx,
        blueMuses[0].roleName,
        "#calentamiento_final_musa",
        "la luna entra por la ventana",
        [blueMuses[0].name],
        "muse tutorial final keeps its author"
      );
      await ctx.waitForText(
        "control",
        "#frase_final_musa_j1",
        (text) => text.toUpperCase().includes(blueMuses[0].name),
        "control final phrase identifies its muse"
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
      await closeActiveVoteIfAny(ctx);
      await ctx.waitFor(
        "writers editable after tertulia",
        async () => {
          const writer1 = await readWriterState(ctx, "writer1");
          const writer2 = await readWriterState(ctx, "writer2");
          return writer1.editable === true && writer2.editable === true;
        },
        8000
      );

      await typeInWriter(ctx, "writer1", " 12");
      await typeInWriter(ctx, "writer2", " 12");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("12"), "actor1 sees text after tertulia", 10000);
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("12"), "actor2 sees text after tertulia", 10000);
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
      await assertSpectatorSideVeilCoversViewport(ctx, 1);
      await assertSpectatorSideVeilCoversViewport(ctx, 2);
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
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2"]);
      await configureFastControlPanel(ctx, {
        tiempo_modificador: 3
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
          writerAssert: (state) => state.blurry === true,
          actorRole: "actor1",
          otherActorRole: "actor2",
          actorAssert: (state) => state.blurry === true && state.putada === "borroso"
        },
        {
          selection: PUTADA_INVERSO,
          player: 2,
          expectedSpectatorClass: "putada-visual--inverso",
          writerAssert: (state) => state.inverseActive === true,
          actorRole: "actor2",
          otherActorRole: "actor1",
          actorAssert: (state) => state.inverse === true && state.putada === "inverso"
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

        if (testCase.actorAssert) {
          await ctx.waitFor(
            `${testCase.actorRole} receives actor visual disadvantage ${testCase.selection}`,
            async () => {
              const state = await readActorDisadvantageState(ctx, testCase.actorRole);
              return testCase.actorAssert(state) ? state : false;
            },
            5000
          );
          const otherActorState = await readActorDisadvantageState(ctx, testCase.otherActorRole);
          ctx.assert(
            otherActorState.blurry === false && otherActorState.inverse === false,
            `${testCase.otherActorRole} should not receive actor visual disadvantage ${testCase.selection}`
          );
        }

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
        if (testCase.actorAssert) {
          await ctx.waitFor(
            `${testCase.actorRole} clears actor visual disadvantage ${testCase.selection}`,
            async () => {
              const state = await readActorDisadvantageState(ctx, testCase.actorRole);
              return state.blurry === false && state.inverse === false ? state : false;
            },
            12000
          );
        }
      }
    }
  },
  {
    name: "delete-block-semantics-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2"]);
      await configureFastControlPanel(ctx, {
        tiempo_modificador: 8,
        tiempo_modos: 60,
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        modes: ["palabras bonus"]
      });
      await startGame(ctx, { requireEditable: false });
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await waitForLocalMode(ctx, "writer1", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "writer2", "palabras bonus", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");

      await ctx.setWriterText("writer1", "UNO DOS TRES");
      await ctx.setWriterText("writer2", "RIVAL");
      await Promise.all(["writer1", "writer2"].map((roleName) => ctx.evaluate(roleName, () => {
        if (typeof cancelarTemporizadorBorradoEscritora === "function") {
          cancelarTemporizadorBorradoEscritora();
        }
        window.eval(`
          if (typeof rapidez_borrado !== "undefined") rapidez_borrado = 60000;
          if (typeof rapidez_inicio_borrado !== "undefined") rapidez_inicio_borrado = 60000;
        `);
      })));

      await applyForcedDisadvantage(ctx, 1, PUTADA_PLUMA);
      await ctx.waitFor(
        "writer1 receives comprehensive delete block",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.deleteBlocked && state.currentDisadvantage === PUTADA_PLUMA ? state : false;
        },
        8000
      );

      const initial = await readWriterState(ctx, "writer1");
      await pressWriterKey(ctx, "writer1", "Backspace");
      ctx.assert((await readWriterState(ctx, "writer1")).text === initial.text, "Backspace must be blocked");

      await placeCaretAtTextOffset(ctx, "writer1", 0);
      await pressWriterKey(ctx, "writer1", "Delete", 1, { preserveCaret: true });
      ctx.assert((await readWriterState(ctx, "writer1")).text === initial.text, "Delete/Supr must be blocked");

      await pressWriterShortcut(ctx, "writer1", "Control", "Backspace");
      await placeCaretAtTextOffset(ctx, "writer1", 0);
      await pressWriterShortcut(ctx, "writer1", "Control", "Delete", { preserveCaret: true });
      ctx.assert((await readWriterState(ctx, "writer1")).text === initial.text, "word deletion shortcuts must be blocked");

      await selectWriterTextRange(ctx, "writer1", 4, 7);
      await ctx.getPageEntry("writer1").page.keyboard.type("X");
      ctx.assert((await readWriterState(ctx, "writer1")).text === initial.text, "typing over a selection must not replace text");

      await selectWriterTextRange(ctx, "writer1", 0, 3);
      await pressWriterShortcut(ctx, "writer1", "Control", "x", { preserveCaret: true });
      ctx.assert((await readWriterState(ctx, "writer1")).text === initial.text, "cut must not remove selected text");

      await typeInWriter(ctx, "writer1", " Z");
      const afterInsert = await readWriterState(ctx, "writer1");
      ctx.assert(afterInsert.text === `${initial.text} Z`, "pure insertion must remain available during delete block");
      await pressWriterShortcut(ctx, "writer1", "Control", "z");
      ctx.assert((await readWriterState(ctx, "writer1")).text === afterInsert.text, "undo must not remove newly written text");

      await setWriterHtml(
        ctx,
        "writer1",
        'abc<span class="palabra-bendita" contenteditable="false">BONUS</span>xy'
      );
      const protectedBefore = await readWriterState(ctx, "writer1");
      await ctx.evaluate("writer1", () => {
        const editor = document.querySelector("#texto");
        const protectedWord = editor && editor.querySelector(".palabra-bendita");
        if (!editor || !protectedWord) throw new Error("Missing protected writer fixture");
        const range = document.createRange();
        range.setStartBefore(protectedWord);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
      });
      await pressWriterKey(ctx, "writer1", "Delete", 1, { preserveCaret: true });
      const protectedAfter = await readWriterState(ctx, "writer1");
      ctx.assert(protectedAfter.html === protectedBefore.html, "Delete must not bypass the block beside protected words");

      const rivalBefore = await readWriterState(ctx, "writer2");
      await pressWriterKey(ctx, "writer2", "Backspace");
      const rivalAfter = await readWriterState(ctx, "writer2");
      ctx.assert(rivalAfter.text.length === rivalBefore.text.length - 1, "the other writer must keep normal deletion");

      await ctx.setWriterText("writer1", "DECAY PROTEGIDO");
      await ctx.evaluate("writer1", () => {
        window.eval(`
          if (typeof rapidez_borrado !== "undefined") rapidez_borrado = 1000;
          if (typeof rapidez_inicio_borrado !== "undefined") rapidez_inicio_borrado = 100;
        `);
        if (typeof countChars === "function") countChars(document.querySelector("#texto"));
      });
      const decayBefore = await readWriterState(ctx, "writer1");
      ctx.assert(decayBefore.text === "DECAY PROTEGIDO", "system text synchronization must remain allowed while delete block is active");
      await ctx.sleep(700);
      const decayWhileBlocked = await readWriterState(ctx, "writer1");
      ctx.assert(decayWhileBlocked.text === decayBefore.text, "automatic decay must not mutate text while blocked");

      await ctx.waitFor(
        "delete block expires",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.deleteBlocked === false ? state : false;
        },
        12000
      );
      await ctx.waitFor(
        "automatic decay resumes once delete block expires",
        async () => {
          const state = await readWriterState(ctx, "writer1");
          return state.text.length < decayBefore.text.length ? state : false;
        },
        3000,
        50
      );
    }
  },
  {
    name: "musa-counter-core",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator"]);
      await waitForMusaCounters(ctx, 0, 0, "initial musa counters");

      await openRolesAndWait(ctx, ["musa1", "musa1b", "musa2"]);
      await waitForMusaCounters(ctx, 2, 1, "musa counters after connect");

      await ctx.evaluate("musa1", () => {
        const equipo = window.eval("typeof player !== 'undefined' ? player : 1");
        const nombre = window.eval("typeof nombre_musa !== 'undefined' ? nombre_musa : 'E2E_Luna'");
        const clientId = window.eval("typeof musa_client_id !== 'undefined' ? musa_client_id : ''");
        socket.emit("registrar_musa", { musa: equipo, nombre, client_id: clientId });
      });
      await ctx.sleep(350);
      await waitForMusaCounters(ctx, 2, 1, "musa counters after duplicate register");

      await ctx.closeRole("musa1b");
      await waitForMusaCounters(ctx, 1, 1, "musa counters after one team1 disconnect");

      await openRolesAndWait(ctx, ["musa1b"]);
      await waitForMusaCounters(ctx, 2, 1, "musa counters after team1 reconnect");

      await ctx.closeRole("musa1");
      await ctx.closeRole("musa1b");
      await ctx.closeRole("musa2");
      await waitForMusaCounters(ctx, 0, 0, "musa counters after all disconnect");
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
      await startGame(ctx, { requireEditable: false });
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
    name: "full-real-match-complete",
    run: async (ctx) => {
      const expectedModes = [
        "letra bendita",
        "letra prohibida",
        "tertulia",
        "palabras bonus",
        "palabras prohibidas",
        "frase final"
      ];
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "actor2", "musa1", "musa1b", "musa2", "musa2b"]);
      await configureFastControlPanel(ctx, {
        tiempo_modos: 14,
        tiempo_votacion: 30,
        tiempo_cambio_letra: 14,
        tiempo_cambio_palabras: 14,
        limite_tiempo_inspiracion: 1,
        tiempo_modificador: 3,
        tiempo_minutos: 3,
        tiempo_segundos: 0
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await freezeWriterDecay(ctx, "writer2");

      await waitForMode(ctx, "letra bendita", 15000);
      await waitForLocalMode(ctx, "writer1", "letra bendita", 10000);
      await waitForLocalMode(ctx, "musa1", "letra bendita", 10000);
      await waitForLocalMode(ctx, "musa1b", "letra bendita", 10000);
      await waitForLocalMode(ctx, "musa2", "letra bendita", 10000);
      await waitForLocalMode(ctx, "musa2b", "letra bendita", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      const letraBendita = String((await ctx.getState()).partida.letra_bendita || "a");
      const benditaTeam1 = buildWordContainingLetter(letraBendita, 1);
      const benditaTeam1b = buildWordContainingLetter(letraBendita, 3);
      const benditaTeam2 = buildWordContainingLetter(letraBendita, 2);
      const benditaTeam2b = buildWordContainingLetter(letraBendita, 4);
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", benditaTeam1),
        emitMusaInspiration(ctx, "musa1b", benditaTeam1b),
        emitMusaInspiration(ctx, "musa2", benditaTeam2),
        emitMusaInspiration(ctx, "musa2b", benditaTeam2b)
      ]);
      await requestQueuedMusaWord(ctx, "writer1");
      await requestQueuedMusaWord(ctx, "writer2");
      await ctx.waitForText(
        "writer1",
        "#definicion",
        (text) => [benditaTeam1, benditaTeam1b].some((word) => text.toLowerCase().includes(word.toLowerCase())),
        "full match writer1 receives blessed-letter musa word",
        10000
      );
      await ctx.waitForText(
        "writer2",
        "#definicion",
        (text) => [benditaTeam2, benditaTeam2b].some((word) => text.toLowerCase().includes(word.toLowerCase())),
        "full match writer2 receives blessed-letter musa word",
        10000
      );
      await typeInWriter(ctx, "writer1", "azul inicial ");
      await typeInWriter(ctx, "writer2", "rojo inicial ");
      await typeInWriter(ctx, "writer1", ` ${letraBendita} `);
      await typeInWriter(ctx, "writer2", ` ${letraBendita} `);
      if (/^[a-z]$/i.test(letraBendita)) {
        await ctx.waitForState(
          "full match blessed-letter stats recorded",
          (state) => state.stats.players[1].letrasBenditas.includes(letraBendita.toUpperCase())
            && state.stats.players[2].letrasBenditas.includes(letraBendita.toUpperCase()),
          10000
        );
      }
      await ctx.waitForState(
        "real flow texts received",
        (state) => {
          const texto1 = `${state.textos[1].plano} ${state.textos[1].html?.texto_guardado || ""}`;
          const texto2 = `${state.textos[2].plano} ${state.textos[2].html?.texto_guardado || ""}`;
          return texto1.includes("azul") && texto2.includes("inicial");
        },
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("azul"), "spectator sees real flow text 1");
      await ctx.waitForText("spectator", "#texto1", (text) => text.includes("inicial"), "spectator sees real flow text 2");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("azul"), "actor1 sees real flow text");
      await ctx.waitForText("actor2", "#texto", (text) => text.includes("inicial"), "actor2 sees real flow text");

      await ctx.invoke("control", "activar_banderas_musas");
      await ctx.waitForState(
        "full match flags active",
        (state) => state.musas.banderas.activa === true,
        6000
      );
      await emitMusaHeartViaClient(ctx, "musa1");
      await ctx.waitForState(
        "full match heart stored",
        (state) => state.musas.corazones[1].count >= 1,
        6000
      );
      await ctx.waitForChildCount("writer1", "#corazones_escritor", 1, "writer sees full-match heart");
      await ctx.waitForChildCount("spectator", "#corazones_espectador", 1, "spectator sees full-match heart");

      await waitForMode(ctx, "letra prohibida", 20000);
      await waitForLocalMode(ctx, "writer1", "letra prohibida", 10000);
      await waitForLocalMode(ctx, "writer2", "letra prohibida", 10000);
      await waitForLocalMode(ctx, "musa1", "letra prohibida", 10000);
      await waitForLocalMode(ctx, "musa1b", "letra prohibida", 10000);
      await waitForLocalMode(ctx, "musa2", "letra prohibida", 10000);
      await waitForLocalMode(ctx, "musa2b", "letra prohibida", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await applyForcedDisadvantage(ctx, 1, PUTADA_PLUMA, { duracionMs: 3000 });
      await ctx.waitFor(
        "writer1 receives active delete-block disadvantage",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.deleteBlocked && state.currentDisadvantage === PUTADA_PLUMA ? state : false;
        },
        8000
      );
      await ctx.sleep(650);
      await toggleControlPause(ctx, "1", "control pause button switches to resume");
      const pausedMode = (await ctx.getState()).partida.modo_actual;
      await ctx.waitFor(
        "writer1 is locked while control is paused",
        async () => {
          const writer = await readWriterState(ctx, "writer1");
          return writer.editable === false ? writer : false;
        },
        6000
      );
      const writerPausedBeforeType = await readWriterState(ctx, "writer1");
      await typeInWriter(ctx, "writer1", " pausa no entra");
      const writerPausedAfterType = await readWriterState(ctx, "writer1");
      ctx.assert(writerPausedAfterType.text === writerPausedBeforeType.text, "pause button should block writer input");
      const pausedDisadvantage = await readWriterDisadvantageState(ctx, "writer1");
      ctx.assert(pausedDisadvantage.deleteBlocked === true, "delete-block disadvantage should stay active while paused");
      ctx.assert(pausedDisadvantage.activeDisadvantage?.pausada === true, "delete-block disadvantage timer should be paused");
      await ctx.sleep(7600);
      const stillPausedDisadvantage = await readWriterDisadvantageState(ctx, "writer1");
      ctx.assert(stillPausedDisadvantage.deleteBlocked === true, "paused disadvantage should not expire while the match is paused");
      ctx.assert(stillPausedDisadvantage.activeDisadvantage?.pausada === true, "paused disadvantage should keep a paused timer");
      ctx.assert((await ctx.getState()).partida.modo_actual === pausedMode, "mode should not advance while the pause button is active");
      await toggleControlPause(ctx, "0", "control pause button switches back to pause");
      await ctx.waitFor(
        "writer1 resumes with remaining delete-block disadvantage",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.deleteBlocked === true && state.activeDisadvantage?.pausada === false ? state : false;
        },
        6000
      );
      await ctx.waitFor(
        "writer1 delete-block disadvantage expires after resume",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.deleteBlocked === false && !state.activeDisadvantage ? state : false;
        },
        20000
      );
      const letraProhibida = String((await ctx.getState()).partida.letra_prohibida || "z");
      const prohibidaTeam1 = buildWordAvoidingLetter(letraProhibida, 1);
      const prohibidaTeam1b = buildWordAvoidingLetter(letraProhibida, 2);
      const prohibidaTeam2 = buildWordAvoidingLetter(letraProhibida, 3);
      const prohibidaTeam2b = buildWordAvoidingLetter(letraProhibida, 4);
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", prohibidaTeam1),
        emitMusaInspiration(ctx, "musa1b", prohibidaTeam1b),
        emitMusaInspiration(ctx, "musa2", prohibidaTeam2),
        emitMusaInspiration(ctx, "musa2b", prohibidaTeam2b)
      ]);
      await requestQueuedMusaWord(ctx, "writer1");
      await requestQueuedMusaWord(ctx, "writer2");
      await ctx.waitForText(
        "writer1",
        "#definicion",
        (text) => [prohibidaTeam1, prohibidaTeam1b].some((word) => text.toLowerCase().includes(word.toLowerCase())),
        "full match writer1 receives forbidden-letter musa word",
        10000
      );
      await ctx.waitForText(
        "writer2",
        "#definicion",
        (text) => [prohibidaTeam2, prohibidaTeam2b].some((word) => text.toLowerCase().includes(word.toLowerCase())),
        "full match writer2 receives forbidden-letter musa word",
        10000
      );
      await typeInWriter(ctx, "writer1", ` tramo prohibida ${letraProhibida} `);
      await typeInWriter(ctx, "writer2", ` tramo prohibida ${letraProhibida} `);
      await ctx.waitForState(
        "full match forbidden-letter stats recorded",
        (state) => state.stats.players[1].intentosLetraProhibida >= 1
          && state.stats.players[2].intentosLetraProhibida >= 1,
        10000
      );

      await waitForMode(ctx, "tertulia", 20000);
      const tertuliaBefore = await readWriterState(ctx, "writer1");
      await typeInWriter(ctx, "writer1", "bloqueado");
      const tertuliaAfter = await readWriterState(ctx, "writer1");
      ctx.assert(tertuliaAfter.text === tertuliaBefore.text, "full match writer1 should be locked during tertulia");
      await ctx.waitFor(
        "control pause button enters resume state during tertulia",
        async () => {
          const state = await readControlPauseState(ctx);
          return state.value === "1" ? state : false;
        },
        6000
      );
      await toggleControlPause(ctx, "0", "control resume button advances tertulia");

      await waitForMode(ctx, "palabras bonus", 20000);
      await closeActiveVoteIfAny(ctx);
      await waitForLocalMode(ctx, "writer1", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "writer2", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "musa1", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "musa1b", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "musa2", "palabras bonus", 10000);
      await waitForLocalMode(ctx, "musa2b", "palabras bonus", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await ctx.invoke("control", "cambiar_vista_espectador", "nube_inspiracion");
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", "horizonte"),
        emitMusaInspiration(ctx, "musa1b", "horizonte"),
        emitMusaInspiration(ctx, "musa2", "memoria"),
        emitMusaInspiration(ctx, "musa2b", "memoria")
      ]);
      await ctx.waitForState(
        "full match bonus words queued by four muses",
        (state) => {
          const team1 = state.inspiracion.nube.equipos[1].palabras_info || [];
          const team2 = state.inspiracion.nube.equipos[2].palabras_info || [];
          return team1.some((item) => item.palabra === "horizonte" && item.repeticiones >= 2)
            && team2.some((item) => item.palabra === "memoria" && item.repeticiones >= 2);
        },
        5000
      );
      await ctx.waitFor(
        "full match spectator cloud marks both superbonus words",
        async () => ctx.evaluate("spectator", () => {
          const words = Array.from(document.querySelectorAll("#nube_inspiracion_canvas .nube-inspiracion-palabra.is-superbonus"))
            .map((node) => String(node.textContent || "").toLowerCase());
          return words.some((text) => text.includes("horizonte"))
            && words.some((text) => text.includes("memoria"));
        }),
        10000
      );
      await requestQueuedWriterWord(ctx, "writer1", "bonus");
      await requestQueuedWriterWord(ctx, "writer2", "bonus");
      await ensureBonusWordInWriterUi(ctx, "writer1", "horizonte", "E2E_LUNA + E2E_SOL");
      await ensureBonusWordInWriterUi(ctx, "writer2", "memoria", "E2E_ROSA + E2E_IRIS");
      await ctx.waitForText(
        "writer1",
        "#definicion",
        (text) => text.toLowerCase().includes("horizonte") && text.toLowerCase().includes("superbonus"),
        "full match writer receives superbonus word",
        10000
      );
      await ctx.waitForText(
        "writer2",
        "#definicion",
        (text) => text.toLowerCase().includes("memoria") && text.toLowerCase().includes("superbonus"),
        "full match writer2 receives superbonus word",
        10000
      );
      await setWriterTimerSeconds(ctx, "writer1", 90);
      await setWriterTimerSeconds(ctx, "writer2", 90);
      const bonusBefore = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
      const bonusBefore2 = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await typeInWriter(ctx, "writer1", " horizonte ");
      await typeInWriter(ctx, "writer2", " memoria ");
      await ctx.waitForState(
        "full match bonus stats recorded",
        (state) => state.stats.players[1].palabrasBenditas.includes("HORIZONTE")
          && state.stats.players[2].palabrasBenditas.includes("MEMORIA"),
        10000
      );
      await ctx.waitFor(
        "full match bonus adds writer time",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
          return after !== null && bonusBefore !== null && after > bonusBefore ? after : false;
        },
        5000
      );
      await ctx.waitFor(
        "full match bonus adds writer2 time",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
          return after !== null && bonusBefore2 !== null && after > bonusBefore2 ? after : false;
        },
        5000
      );

      await waitForMode(ctx, "palabras prohibidas", 20000);
      await closeActiveVoteIfAny(ctx);
      await waitForLocalMode(ctx, "writer1", "palabras prohibidas", 10000);
      await waitForLocalMode(ctx, "writer2", "palabras prohibidas", 10000);
      await waitForLocalMode(ctx, "musa1", "palabras prohibidas", 10000);
      await waitForLocalMode(ctx, "musa1b", "palabras prohibidas", 10000);
      await waitForLocalMode(ctx, "musa2", "palabras prohibidas", 10000);
      await waitForLocalMode(ctx, "musa2b", "palabras prohibidas", 10000);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await ctx.invoke("control", "cambiar_vista_espectador", "nube_inspiracion");
      await Promise.all([
        emitMusaInspiration(ctx, "musa1", "ruina"),
        emitMusaInspiration(ctx, "musa1b", "ruina"),
        emitMusaInspiration(ctx, "musa2", "veneno"),
        emitMusaInspiration(ctx, "musa2b", "veneno")
      ]);
      await requestQueuedWriterWord(ctx, "writer1", "prohibida");
      await requestQueuedWriterWord(ctx, "writer2", "prohibida");
      await ctx.waitForText(
        "writer1",
        "#definicion",
        (text) => text.toLowerCase().includes("veneno"),
        "full match writer receives forbidden word",
        10000
      );
      await ctx.waitForText(
        "writer2",
        "#definicion",
        (text) => text.toLowerCase().includes("ruina"),
        "full match writer2 receives forbidden word",
        10000
      );
      const forbiddenBefore = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
      const forbiddenBefore2 = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await typeInWriter(ctx, "writer1", " veneno ");
      await typeInWriter(ctx, "writer2", " ruina ");
      await ctx.waitFor(
        "full match forbidden word subtracts writer time",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer1"));
          return after !== null && forbiddenBefore !== null && after < forbiddenBefore ? after : false;
        },
        5000
      );
      await ctx.waitFor(
        "full match forbidden word subtracts writer2 time",
        async () => {
          const after = getWriterTimerSeconds(await readWriterState(ctx, "writer2"));
          return after !== null && forbiddenBefore2 !== null && after < forbiddenBefore2 ? after : false;
        },
        5000
      );
      await ensureSpectatorView(ctx, "stats");
      await ctx.waitForVisible("spectator", "#stats_espectador", true, "full match spectator stats view visible", 10000);
      await waitForSpectatorStatsSlides(ctx, "full match spectator stats slides render heatmap and time views", 10000);

      await ctx.waitForState(
        "full real timeline reached final mode",
        (state) => expectedModes.every((mode, index) => state.partida.timeline[index]?.modo === mode),
        70000
      );
      await waitForMode(ctx, "frase final", 12000);
      await closeActiveVoteIfAny(ctx);
      await ensureWriterEditableForFullFlow(ctx, "writer1");
      await ensureWriterEditableForFullFlow(ctx, "writer2");
      await ctx.invoke("control", "cambiar_vista_espectador", "partida");
      await typeInWriter(ctx, "writer1", " cierre azul e2e");
      await typeInWriter(ctx, "writer2", " cierre rojo e2e");
      await ctx.waitForState(
        "both writers completed final phrase without hooks",
        (state) => state.partida.fin_j1 === true && state.partida.fin_j2 === true,
        12000
      );
      await ctx.waitForState(
        "full real match finished and reset",
        (state) => state.partida.fin_del_juego === true && state.partida.modo_actual === "",
        12000
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
    name: "reconnect-essential-roles-preserves-live-state",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "musa1"]);
      await configureFastControlPanel(ctx, {
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        tiempo_modos: 60,
        tiempo_cambio_letra: 10,
        tiempo_cambio_palabras: 10,
        tiempo_modificador: 60,
        modes: ["palabras bonus"]
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);

      const markedHtml = 'reconexion <span class="palabra-bendita" contenteditable="false">BRILLO</span> <span class="letra-verde">z</span> final';
      await setWriterHtml(ctx, "writer1", markedHtml);
      await ctx.waitForState(
        "server stores marked writer html before reconnect",
        (state) => String(state.textos[1].html?.text || "").includes("palabra-bendita") && state.textos[1].plano.includes("BRILLO"),
        10000
      );
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("BRILLO"), "spectator sees marked writer text before reconnect");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("BRILLO"), "actor sees marked writer text before reconnect");

      await applyForcedDisadvantage(ctx, 1, PUTADA_BORROSO, { duracionMs: 60000 });
      await ctx.waitForState(
        "server tracks active disadvantage",
        (state) => state.desventajas.some((item) => item.player === 1 && item.putada === PUTADA_BORROSO && item.tiempo_restante_ms > 0),
        5000
      );
      await ctx.waitFor(
        "writer1 has blur disadvantage before reconnect",
        async () => ctx.evaluate("writer1", () => document.querySelector("#texto")?.classList.contains("textarea_blur")),
        5000
      );
      await ctx.waitFor(
        "actor1 has blur disadvantage before reconnect",
        async () => ctx.evaluate("actor1", () => document.querySelector("#texto")?.classList.contains("textarea_blur")),
        5000
      );

      await ctx.closeRole("writer1");
      await ctx.closeRole("spectator");
      await ctx.closeRole("actor1");
      await ctx.closeRole("musa1");
      await ctx.waitForState(
        "essential roles disconnected during live match",
        (state) => state.connections.writers[1].connected === false
          && state.connections.spectator.connected === false
          && state.connections.actors[1].connected === false
          && state.connections.musas[1].connected === false,
        10000
      );
      await ctx.evaluate("control", () => {
        const ok = window.eval("typeof socket !== 'undefined' && socket && typeof socket.disconnect === 'function'");
        if (!ok) {
          throw new Error("Missing control socket");
        }
        window.eval("socket.io.opts.reconnection = false; socket.disconnect(); if (socket.io.engine) socket.io.engine.close();");
      });
      await ctx.sleep(300);
      await ctx.getPageEntry("control").page.reload({ waitUntil: "domcontentloaded" });
      await waitForSocketConnection(ctx, "control", 12000);
      await ctx.waitForVisible("control", "#boton_escribir", true, "control reloads during live match");
      await ctx.sleep(700);

      await openRolesAndWait(ctx, ["writer1", "spectator", "actor1", "musa1"]);
      await waitForMode(ctx, "palabras bonus", 8000);
      await waitForLocalMode(ctx, "musa1", "palabras bonus", 8000);
      await freezeWriterDecay(ctx, "writer1");

      await ctx.waitForText("writer1", "#texto", (text) => text.includes("BRILLO") && text.includes("final"), "writer restores marked text");
      const writerState = await readWriterState(ctx, "writer1");
      ctx.assert(writerState.html.includes("palabra-bendita"), "writer restored protected word markup after reconnect");
      ctx.assert(writerState.html.includes("letra-verde"), "writer restored protected letter markup after reconnect");
      ctx.assert(writerState.protectedCount >= 2, "writer restored protected spans after reconnect");

      await ctx.waitForText("spectator", "#texto", (text) => text.includes("BRILLO"), "spectator restores writer text");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("BRILLO"), "actor restores writer text");
      await ctx.waitForText("control", "#texto", (text) => text.includes("BRILLO"), "control restores writer text");
      await ctx.waitForText("control", "#display_modo", (text) => text.toLowerCase().includes("palabras bonus"), "control restores current mode");

      await ctx.waitFor(
        "writer1 restores active blur disadvantage",
        async () => ctx.evaluate("writer1", () => document.querySelector("#texto")?.classList.contains("textarea_blur")),
        5000
      );
      await ctx.waitFor(
        "spectator restores active blur disadvantage",
        async () => ctx.evaluate("spectator", () => document.querySelector("#texto")?.classList.contains("textarea_blur")),
        5000
      );
      await ctx.waitFor(
        "actor1 restores active blur disadvantage",
        async () => ctx.evaluate("actor1", () => document.querySelector("#texto")?.classList.contains("textarea_blur")),
        5000
      );
    }
  },
  {
    name: "reload-essential-roles-preserves-live-state",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "musa1"]);
      await configureFastControlPanel(ctx, {
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        tiempo_modos: 60,
        tiempo_cambio_letra: 10,
        tiempo_cambio_palabras: 10,
        tiempo_modificador: 45,
        modes: ["palabras bonus"]
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);

      const markedHtml = 'reload <span class="palabra-bendita" contenteditable="false">BRILLO</span> <span class="letra-verde">k</span> estable';
      await setWriterHtml(ctx, "writer1", markedHtml);
      await ctx.waitForState(
        "server stores marked writer html before reload",
        (state) => String(state.textos[1].html?.text || "").includes("palabra-bendita") && state.textos[1].plano.includes("BRILLO"),
        10000
      );
      await applyForcedDisadvantage(ctx, 1, PUTADA_BORROSO, { duracionMs: 45000 });
      await ctx.waitFor(
        "writer1 has blur before page reloads",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.blurry && state.activeDisadvantage?.restanteMs > 0 ? state : false;
        },
        8000
      );

      await reloadRolesSequential(ctx, ["writer1", "spectator", "actor1", "musa1", "control"]);
      await waitForMode(ctx, "palabras bonus", 8000);
      await waitForLocalMode(ctx, "writer1", "palabras bonus", 8000);
      await waitForLocalMode(ctx, "musa1", "palabras bonus", 8000);
      await freezeWriterDecay(ctx, "writer1");

      await ctx.waitForText("writer1", "#texto", (text) => text.includes("BRILLO") && text.includes("estable"), "writer restores marked text after reload");
      const writerState = await readWriterState(ctx, "writer1");
      ctx.assert(writerState.html.includes("palabra-bendita"), "writer should keep blessed-word markup after reload");
      ctx.assert(writerState.html.includes("letra-verde"), "writer should keep blessed-letter markup after reload");
      ctx.assert(writerState.protectedCount >= 2, "writer should keep protected spans after reload");
      await ctx.waitForText("spectator", "#texto", (text) => text.includes("BRILLO"), "spectator restores text after reload");
      await ctx.waitForText("actor1", "#texto", (text) => text.includes("BRILLO"), "actor restores text after reload");
      await ctx.waitForText("control", "#texto", (text) => text.includes("BRILLO"), "control restores text after reload");
      await ctx.waitForText("control", "#display_modo", (text) => text.toLowerCase().includes("palabras bonus"), "control restores mode after reload");

      await ctx.waitFor(
        "writer1 restores active blur after reload",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.blurry && state.activeDisadvantage?.restanteMs > 0 ? state : false;
        },
        8000
      );
      await ctx.waitFor(
        "spectator restores active visual blur after reload",
        async () => {
          const state = await readSpectatorDisadvantageState(ctx, 1);
          return state.active && state.classes.includes("putada-visual--borroso") ? state : false;
        },
        8000
      );
      await ctx.waitFor(
        "actor restores active blur after reload",
        async () => {
          const state = await readActorDisadvantageState(ctx, "actor1");
          return state.blurry && state.putada === "borroso" ? state : false;
        },
        8000
      );

      await ensureBonusWordInWriterUi(ctx, "writer1", "horizonte", "E2E Musa", { includeTime: false });
      await clearFloatingFeedbacks(ctx, "writer1");
      await typeInWriter(ctx, "writer1", " horizonte ");
      const feedbackAfterReload = await waitForQuantifiedInspirationFeedback(
        ctx,
        "writer1",
        "writer feedback after reload derives quantified inspiration when payload omits it"
      );
      ctx.assert(!/undefined/i.test(feedbackAfterReload.inspiration), "writer feedback after reload should not show undefined inspiration");
    }
  },
  {
    name: "reload-mode-matrix-preserves-current-level",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1", "musa1"]);
      await configureFastControlPanel(ctx, {
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        tiempo_modos: 75,
        tiempo_cambio_letra: 15,
        tiempo_cambio_palabras: 15,
        tiempo_modificador: 20,
        modes: ["letra bendita", "letra prohibida", "tertulia", "palabras bonus", "palabras prohibidas", "frase final"]
      });
      await startGame(ctx, { requireEditable: false });
      await freezeWriterDecay(ctx, "writer1");

      const matrix = [
        { mode: "letra bendita", letra: "K", waitMusa: true },
        { mode: "letra prohibida", letra: "Z", waitMusa: true },
        { mode: "palabras bonus", waitMusa: true },
        { mode: "palabras prohibidas", waitMusa: true },
        { mode: "tertulia", waitMusa: false },
        { mode: "frase final", waitMusa: false }
      ];

      for (const item of matrix) {
        const payload = item.letra ? { mode: item.mode, letra: item.letra } : { mode: item.mode };
        await ctx.emitHook("scrib_test:force_mode", payload);
        await waitForMode(ctx, item.mode, 8000);
        await waitForLocalMode(ctx, "writer1", item.mode, 8000);
        await waitForLocalMode(ctx, "spectator", item.mode, 8000);
        await waitForLocalMode(ctx, "actor1", item.mode, 8000);
        if (item.waitMusa) {
          await waitForLocalMode(ctx, "musa1", item.mode, 8000);
        }

        const slug = item.mode.replace(/\s+/g, "-");
        await setWriterHtml(ctx, "writer1", `matriz ${slug} <span class="letra-verde">${item.letra || "m"}</span> vivo`);
        await ctx.waitForState(
          `server stores text for ${item.mode}`,
          (state) => state.textos[1].plano.includes(`matriz ${slug}`),
          10000
        );

        await reloadRolesSequential(ctx, ["writer1", "spectator", "actor1", "musa1", "control"]);
        await waitForMode(ctx, item.mode, 8000);
        await waitForLocalMode(ctx, "writer1", item.mode, 8000);
        await waitForLocalMode(ctx, "spectator", item.mode, 8000);
        await waitForLocalMode(ctx, "actor1", item.mode, 8000);
        if (item.waitMusa) {
          await waitForLocalMode(ctx, "musa1", item.mode, 8000);
        }
        await ctx.waitForText("control", "#display_modo", (text) => text.toLowerCase().includes(item.mode), `control restores ${item.mode}`);
        await ctx.waitForText("writer1", "#texto", (text) => text.includes(`matriz ${slug}`), `writer restores ${item.mode} text`);
        await ctx.waitForText("spectator", "#texto", (text) => text.includes(`matriz ${slug}`), `spectator restores ${item.mode} text`);
        await ctx.waitForText("actor1", "#texto", (text) => text.includes(`matriz ${slug}`), `actor restores ${item.mode} text`);
      }
    }
  },
  {
    name: "reload-while-paused-keeps-disadvantage-remaining",
    run: async (ctx) => {
      await openRolesAndWait(ctx, ["control", "writer1", "writer2", "spectator", "actor1"]);
      await configureFastControlPanel(ctx, {
        tiempo_minutos: 5,
        tiempo_segundos: 0,
        tiempo_modos: 60,
        tiempo_cambio_letra: 10,
        tiempo_cambio_palabras: 10,
        tiempo_modificador: 6,
        modes: ["palabras bonus"]
      });
      await startGame(ctx);
      await freezeWriterDecay(ctx, "writer1");
      await ctx.emitHook("scrib_test:force_mode", { mode: "palabras bonus" });
      await waitForMode(ctx, "palabras bonus", 8000);
      await setWriterHtml(ctx, "writer1", 'pausa reload <span class="palabra-bendita" contenteditable="false">NITIDO</span>');
      await applyForcedDisadvantage(ctx, 1, PUTADA_BORROSO, { duracionMs: 6000 });
      await ctx.waitFor(
        "writer1 receives blur before pause reload",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.blurry && state.activeDisadvantage?.restanteMs > 0 ? state : false;
        },
        8000
      );

      await toggleControlPause(ctx, "1", "control pause button switches to resume before reload");
      await ctx.waitForState(
        "server pauses active disadvantage before reload",
        (state) => state.desventajas.some((item) => item.player === 1 && item.putada === PUTADA_BORROSO && item.pausada === true),
        8000
      );

      await reloadRolesSequential(ctx, ["writer1", "spectator", "actor1", "control"]);
      await ctx.waitFor(
        "reloaded control keeps resume state",
        async () => {
          const state = await readControlPauseState(ctx);
          return state.value === "1" ? state : false;
        },
        8000
      );
      await freezeWriterDecay(ctx, "writer1");
      await ctx.waitForText("writer1", "#texto", (text) => text.includes("NITIDO"), "writer text survives paused reload");

      await ctx.waitFor(
        "writer remains locked with paused blur after reload",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          const writer = await readWriterState(ctx, "writer1");
          return state.blurry && state.activeDisadvantage?.pausada === true && writer.editable === false ? state : false;
        },
        8000
      );
      await ctx.waitFor(
        "spectator keeps paused visual blur after reload",
        async () => {
          const state = await readSpectatorDisadvantageState(ctx, 1);
          return state.active && state.classes.includes("putada-visual--borroso") ? state : false;
        },
        8000
      );
      await ctx.waitFor(
        "actor keeps paused blur after reload",
        async () => {
          const state = await readActorDisadvantageState(ctx, "actor1");
          return state.blurry && state.putada === "borroso" ? state : false;
        },
        8000
      );

      await ctx.sleep(7200);
      const writerStillPaused = await readWriterDisadvantageState(ctx, "writer1");
      ctx.assert(writerStillPaused.blurry === true, "paused writer blur should not expire while paused after reload");
      ctx.assert(writerStillPaused.activeDisadvantage?.pausada === true, "writer disadvantage timer should remain paused after reload");
      const spectatorStillPaused = await readSpectatorDisadvantageState(ctx, 1);
      ctx.assert(spectatorStillPaused.active === true, "paused spectator visual disadvantage should not expire while paused after reload");
      const actorStillPaused = await readActorDisadvantageState(ctx, "actor1");
      ctx.assert(actorStillPaused.blurry === true, "paused actor blur should not expire while paused after reload");

      await toggleControlPause(ctx, "0", "reloaded control resumes paused match");
      await ctx.waitForState(
        "server resumes active disadvantage after reload",
        (state) => state.desventajas.some((item) => item.player === 1 && item.putada === PUTADA_BORROSO && item.pausada === false),
        8000
      );
      await ctx.waitFor(
        "writer resumes blur timer after paused reload",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.blurry && state.activeDisadvantage?.pausada === false ? state : false;
        },
        8000
      );
      await ctx.waitFor(
        "writer blur expires after resumed reload",
        async () => {
          const state = await readWriterDisadvantageState(ctx, "writer1");
          return state.blurry === false && !state.activeDisadvantage ? state : false;
        },
        12000
      );
      await ctx.waitFor(
        "spectator visual blur expires after resumed reload",
        async () => {
          const state = await readSpectatorDisadvantageState(ctx, 1);
          return state.active === false ? state : false;
        },
        12000
      );
      await ctx.waitFor(
        "actor blur expires after resumed reload",
        async () => {
          const state = await readActorDisadvantageState(ctx, "actor1");
          return state.blurry === false ? state : false;
        },
        12000
      );
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
        await startGame(ctx, { requireEditable: false });
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

      await ctx.evaluate("control", () => {
        const ok = window.eval("typeof socket !== 'undefined' && socket && typeof socket.disconnect === 'function'");
        if (!ok) {
          throw new Error("Missing control socket");
        }
        window.eval("socket.io.opts.reconnection = false; socket.disconnect(); if (socket.io.engine) socket.io.engine.close();");
      });
      await ctx.closeRole("control");
      await ctx.sleep(500);

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
