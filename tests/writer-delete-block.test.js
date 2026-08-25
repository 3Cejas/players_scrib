const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function loadDeletionDomain() {
  const window = {};
  vm.runInNewContext(read("game/js/domains/editor-deletion.js"), { window }, {
    filename: "game/js/domains/editor-deletion.js"
  });
  return window.ScribEditorDeletion;
}

function cancellableEvent(type, values = {}) {
  return {
    type,
    defaultPrevented: false,
    propagationStopped: false,
    immediatePropagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
    },
    ...values
  };
}

test("delete block recognizes keyboard, mobile, cut and history deletion routes", () => {
  const deletion = loadDeletionDomain();

  for (const inputType of [
    "deleteContentBackward",
    "deleteContentForward",
    "deleteWordBackward",
    "deleteWordForward",
    "deleteSoftLineBackward",
    "deleteSoftLineForward",
    "deleteHardLineBackward",
    "deleteHardLineForward",
    "deleteEntireSoftLine",
    "deleteByCut",
    "deleteByDrag",
    "deleteCompositionText",
    "historyUndo",
    "historyRedo"
  ]) {
    assert.equal(deletion.esInputTypeBorrado(inputType), true, inputType);
    assert.equal(
      deletion.esEventoBorradoManual({ type: "beforeinput", inputType }),
      true,
      `beforeinput ${inputType}`
    );
  }

  for (const event of [
    { type: "keydown", key: "Backspace" },
    { type: "keydown", key: "Delete" },
    { type: "keydown", key: "Delete", ctrlKey: true, altKey: true, shiftKey: true },
    { type: "keydown", key: "", keyCode: 8 },
    { type: "keydown", key: "", which: 46 },
    { type: "keydown", key: "x", ctrlKey: true },
    { type: "keydown", key: "x", metaKey: true },
    { type: "keydown", key: "z", ctrlKey: true },
    { type: "keydown", key: "z", metaKey: true, shiftKey: true },
    { type: "keydown", key: "y", ctrlKey: true },
    { type: "cut" }
  ]) {
    assert.equal(deletion.esEventoBorradoManual(event), true, JSON.stringify(event));
  }
});

test("delete block leaves ordinary writing, composition and paste untouched", () => {
  const deletion = loadDeletionDomain();

  for (const event of [
    { type: "keydown", key: "a" },
    { type: "keydown", key: "Enter" },
    { type: "keydown", key: "v", ctrlKey: true },
    { type: "keydown", key: "c", metaKey: true },
    { type: "keydown", key: "h", ctrlKey: true },
    { type: "keydown", key: "d", ctrlKey: true },
    { type: "keydown", key: "k", ctrlKey: true },
    { type: "keydown", key: "u", ctrlKey: true },
    { type: "keydown", key: "w", ctrlKey: true },
    { type: "keydown", key: "u", ctrlKey: true, altKey: true },
    { type: "beforeinput", inputType: "insertText" },
    { type: "beforeinput", inputType: "insertCompositionText" },
    { type: "beforeinput", inputType: "insertFromPaste" },
    { type: "beforeinput", inputType: "insertParagraph" },
    { type: "beforeinput", inputType: "formatBold" },
    { type: "input", inputType: "deleteContentBackward" }
  ]) {
    assert.equal(deletion.esEventoBorradoManual(event), false, JSON.stringify(event));
  }
});

test("selection replacement and move-drag are deletion equivalents", () => {
  const deletion = loadDeletionDomain();
  const selectedRange = { collapsed: false };
  const collapsedRange = { collapsed: true };

  for (const inputType of [
    "insertText",
    "insertFromPaste",
    "insertFromDrop",
    "insertParagraph",
    "insertLineBreak"
  ]) {
    assert.equal(deletion.esEventoBorradoManual({
      type: "beforeinput",
      inputType,
      getTargetRanges: () => [selectedRange]
    }), true, `${inputType} must not replace selected text`);
    assert.equal(deletion.esEventoBorradoManual({
      type: "beforeinput",
      inputType,
      getTargetRanges: () => [collapsedRange]
    }), false, `${inputType} remains valid at a collapsed caret`);
  }

  for (const collapsed of [true, false]) {
    assert.equal(deletion.esEventoBorradoManual({
      type: "beforeinput",
      inputType: "insertReplacementText",
      getTargetRanges: () => [{ collapsed }]
    }), true, "replacement text is always destructive");
  }

  assert.equal(deletion.esEventoBorradoManual({
    type: "beforeinput",
    inputType: "insertCompositionText",
    isComposing: true,
    getTargetRanges: () => [selectedRange]
  }), true, "composition cannot start by replacing an existing selection");
  assert.equal(deletion.esEventoBorradoManual({
    type: "beforeinput",
    inputType: "insertCompositionText",
    isComposing: true,
    getTargetRanges: () => [collapsedRange]
  }), false, "composition can start at a collapsed caret");
  assert.equal(deletion.esEventoBorradoManual({
    type: "beforeinput",
    inputType: "insertCompositionText",
    isComposing: true,
    getTargetRanges: () => [selectedRange]
  }, null, { composicionIniciadaEnCaret: true }), false, "an existing caret-started IME composition can update itself");

  const selectedEditor = {
    ownerDocument: {
      getSelection() {
        return {
          rangeCount: 1,
          getRangeAt() {
            return { collapsed: false, commonAncestorContainer: selectedEditor };
          }
        };
      }
    },
    contains(node) {
      return node === this;
    }
  };
  assert.equal(deletion.esEventoBorradoManual({ type: "dragstart" }, selectedEditor), true);
  assert.equal(deletion.esEventoBorradoManual({
    type: "drop",
    dataTransfer: { dropEffect: "move" }
  }), true);
  assert.equal(deletion.esEventoBorradoManual({
    type: "drop",
    dataTransfer: { dropEffect: "copy" }
  }), false);
});

test("IME started at a caret remains writable while composition over a selection is blocked", () => {
  const deletion = loadDeletionDomain();
  const listeners = new Map();
  let collapsed = true;
  const editor = {
    innerHTML: "ABC",
    ownerDocument: {
      getSelection() {
        return {
          rangeCount: 1,
          getRangeAt() {
            return { collapsed, commonAncestorContainer: editor };
          }
        };
      }
    },
    contains(node) {
      return node === this;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener() {}
  };
  deletion.instalarBloqueoBorradoManual(editor, () => true);

  const compositionStartAtCaret = cancellableEvent("compositionstart");
  listeners.get("compositionstart")(compositionStartAtCaret);
  assert.equal(compositionStartAtCaret.defaultPrevented, false);

  collapsed = false;
  const compositionUpdate = cancellableEvent("beforeinput", {
    inputType: "insertCompositionText",
    isComposing: true
  });
  listeners.get("beforeinput")(compositionUpdate);
  assert.equal(compositionUpdate.defaultPrevented, false, "the IME may update its own composition range");
  listeners.get("compositionend")(cancellableEvent("compositionend"));

  const compositionOverSelection = cancellableEvent("compositionstart");
  listeners.get("compositionstart")(compositionOverSelection);
  assert.equal(compositionOverSelection.defaultPrevented, true);
  assert.equal(compositionOverSelection.immediatePropagationStopped, true);
});

test("installed guard prevents deletion only while the authoritative flag is active", () => {
  const deletion = loadDeletionDomain();
  const listeners = new Map();
  let active = false;
  const editor = {
    innerHTML: "texto",
    addEventListener(type, listener, capture) {
      assert.equal(capture, true);
      listeners.set(type, listener);
    },
    removeEventListener(type, listener, capture) {
      assert.equal(capture, true);
      if (listeners.get(type) === listener) listeners.delete(type);
    }
  };
  const dispose = deletion.instalarBloqueoBorradoManual(editor, () => active);

  const inactiveBackspace = cancellableEvent("keydown", { key: "Backspace" });
  listeners.get("keydown")(inactiveBackspace);
  assert.equal(inactiveBackspace.defaultPrevented, false);

  active = true;
  for (const event of [
    cancellableEvent("keydown", { key: "Backspace", ctrlKey: true }),
    cancellableEvent("keydown", { key: "Delete" }),
    cancellableEvent("beforeinput", { inputType: "deleteContentBackward" }),
    cancellableEvent("beforeinput", { inputType: "deleteByCut" }),
    cancellableEvent("beforeinput", { inputType: "historyUndo" }),
    cancellableEvent("cut")
  ]) {
    listeners.get(event.type)(event);
    assert.equal(event.defaultPrevented, true, `${event.type} ${event.inputType || event.key || ""}`);
    assert.equal(event.propagationStopped, true);
    assert.equal(event.immediatePropagationStopped, true, "legacy editor handlers must not run");
  }

  const normalText = cancellableEvent("beforeinput", { inputType: "insertText", data: "a" });
  listeners.get("beforeinput")(normalText);
  assert.equal(normalText.defaultPrevented, false);

  dispose();
  assert.equal(listeners.size, 0);
});

test("non-cancelable input fallback restores deleted or replaced markup before bubbling", () => {
  const deletion = loadDeletionDomain();
  const listeners = new Map();
  const editor = {
    innerHTML: "ABC",
    focusCalls: 0,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    focus() {
      this.focusCalls += 1;
    }
  };
  deletion.instalarBloqueoBorradoManual(editor, () => true);

  const beforeDelete = cancellableEvent("beforeinput", {
    inputType: "deleteContentBackward",
    cancelable: false
  });
  listeners.get("beforeinput")(beforeDelete);
  editor.innerHTML = "AB";
  const deletedInput = cancellableEvent("input", { inputType: "deleteContentBackward", cancelable: false });
  listeners.get("input")(deletedInput);
  assert.equal(editor.innerHTML, "ABC");
  assert.equal(deletedInput.immediatePropagationStopped, true);

  const normalBeforeInput = cancellableEvent("beforeinput", {
    inputType: "insertText",
    data: "D",
    getTargetRanges: () => [{ collapsed: true }]
  });
  listeners.get("beforeinput")(normalBeforeInput);
  assert.equal(normalBeforeInput.defaultPrevented, false);
  editor.innerHTML = "ABCD";
  listeners.get("input")(cancellableEvent("input", { inputType: "insertText", data: "D" }));
  assert.equal(editor.innerHTML, "ABCD", "ordinary text updates the safe snapshot");

  editor.innerHTML = "ABC";
  listeners.get("input")(cancellableEvent("input", { inputType: "deleteContentBackward" }));
  assert.equal(editor.innerHTML, "ABCD", "input without beforeinput still rolls back deletion");

  const beforeReplacement = cancellableEvent("beforeinput", {
    inputType: "insertFromPaste",
    cancelable: false,
    getTargetRanges: () => [{ collapsed: false }]
  });
  listeners.get("beforeinput")(beforeReplacement);
  editor.innerHTML = "PEGADO";
  listeners.get("input")(cancellableEvent("input", { inputType: "insertFromPaste" }));
  assert.equal(editor.innerHTML, "ABCD", "selection replacement is rolled back if prevention is ignored");
  assert.ok(editor.focusCalls >= 3);
});

test("canceled keyboard, cut and drag events never leave a stale rollback", () => {
  const deletion = loadDeletionDomain();
  const listeners = new Map();
  const editor = {
    innerHTML: "BASE",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener() {}
  };
  deletion.instalarBloqueoBorradoManual(editor, () => true);

  for (const event of [
    cancellableEvent("keydown", { key: "Backspace" }),
    cancellableEvent("cut"),
    cancellableEvent("dragstart", {
      dataTransfer: { effectAllowed: "move" }
    })
  ]) {
    listeners.get(event.type)(event);
    assert.equal(event.defaultPrevented, true);

    editor.innerHTML += "·CICLO";
    const systemInput = cancellableEvent("input");
    listeners.get("input")(systemInput);
    assert.equal(
      editor.innerHTML.endsWith("·CICLO"),
      true,
      `${event.type} must not roll back a later game-cycle mutation`
    );
    assert.equal(systemInput.defaultPrevented, false);
  }
});

test("automatic deletion is postponed before mutation and keeps rescheduling", () => {
  const actions = read("game/players/js/actions.js");
  const state = read("game/players/js/state.js");
  const start = actions.indexOf("function borrar(");
  const end = actions.indexOf("// Funci", start);
  const borrarBody = actions.slice(start, end);
  const guardIndex = borrarBody.indexOf("posponerBorradoAutomaticoBloqueado()");
  const mutationIndex = borrarBody.indexOf("borrarUltimoCaracterEditable()");

  assert.ok(start >= 0 && end > start, "automatic deletion function must exist");
  assert.ok(guardIndex >= 0, "automatic deletion must consult the active block");
  assert.ok(mutationIndex > guardIndex, "the block must run before any editor mutation");
  assert.match(
    actions,
    /function posponerBorradoAutomaticoBloqueado\(\)[\s\S]*if \(!estaBloqueadoBorradoEscritora\(\)\) return false;[\s\S]*programarBorradoEscritora\(rapidez_borrado,[\s\S]*borrar\(revisionProgramada\);[\s\S]*return true;/
  );
  assert.match(
    state,
    /instalarBloqueoBorradoManual\([\s\S]*texto,[\s\S]*\(\) => debeBloquearBorradoPorDestreza\(\)/
  );
});
