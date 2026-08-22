# Role JavaScript Structure

The browser roles use classic scripts, not ES modules, so shared names still live in the page global scope. Each refactored role is loaded in this order:

1. `actions.js`: UI actions called from HTML attributes and user controls.
2. `state.js`: DOM references, local state, render helpers and socket instance creation.
3. `socket-events.js`: socket listeners and event-driven handlers.
4. `index.js`: small role registration marker.

Legacy role stubs were removed from the refactored roles. Active role code belongs in the files above.

Remaining legacy active entrypoints were renamed to describe their role:

- `game/public/js/musa-selector.js`: public muse landing/selection screen.
- `game/actors/js/actor-selector.js`: actor landing/selection screen.
- `game/actors/source/js/actions.js` and `socket-events.js`: source actor UI actions and socket runtime.
- `game/jurado/js/state.js`, `socket-events.js` and `index.js`: jury review UI, local notes/evaluation state and read-only live socket runtime.
- `game/dramaturgia/js/model.js`, `state.js`, `socket-events.js`, `tools-model.js`, `tools.js` and `index.js`: bounded live-state model, frozen causal HTML map, nine-role chronology, live read-only replicas and authenticated match-simulation controls.
- `game/dramaturgia/js/history-snapshots.js` and `history-controller.js`: sanitize, hash, deduplicate and persist immutable DOM checkpoints for the nine canonical role surfaces; missing pre-observation history remains explicitly missing.
- `game/js/monitor-socket.js`: shared Socket.IO bridge that turns a role surface into a non-counting, read-only Dramaturgia replica.
- `1p_scrib/game/js/gameplay-state.js`, `gameplay-i18n.js`, `gameplay-mode-config.js`, `fullscreen-controls.js`, `editor-progress.js`, `animation-utils.js`, `text-download.js`, `options-panel.js`, `mode-settings-panel.js`, `attributes-panel.js` and `numeric-settings.js`: single-player setup/actions split by state, translations, mode configuration, fullscreen controls, editor progress, animation helpers, text download, options UI, mode settings, attributes and numeric inputs.
- `1p_scrib/game/js/runtime-core.js`, `i18n.js`, `layout.js`, `writer-cursor.js`, `hud-levels.js`, `match-summary.js`, `word-provider.js`, `runtime-state.js`, `audio.js`, `mode-data.js`, `mode-effects.js`, `mode-lifecycle.js`, `protected-text.js`, `final-phrase.js`, `mode-rules.js`, `disadvantages.js`, `boot-screen.js`, `writer-text.js`, `match-runtime.js` and `pdf-export.js`: single-player runtime split by shared bootstrap, translations, responsive layout, cursor, HUD/levels, match summary, word provider, runtime state, audio, mode data/effects/lifecycle/rules, protected text, final phrase handling, disadvantages, boot screen, writer text helpers, match lifecycle and PDF export.

Sockets are created with `autoConnect: false` in `state.js` and connected only after `socket.on(...)` handlers are registered. This keeps role registration and initial sync from racing the listener setup.
