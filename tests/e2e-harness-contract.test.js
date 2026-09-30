const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("E2E writers become ready on the real pre-match setup screen", () => {
  const runner = read("e2e/runner/index.js");
  const specs = read("e2e/specs/index.js");

  const writerBlocks = runner.match(/writer[12]: \{[\s\S]*?\n  \}/g) || [];
  assert.equal(writerBlocks.length, 2);
  writerBlocks.forEach((block) => {
    assert.match(block, /readySelector: "#atributos-container"/);
    assert.doesNotMatch(block, /readySelector: "#texto"/);
  });
  const museBlocks = runner.match(/musa(?:1|1b|2|2b): \{[\s\S]*?\n  \}/g) || [];
  assert.equal(museBlocks.length, 4);
  museBlocks.forEach((block) => {
    assert.match(block, /readySelector: "#musa_world_entry"/);
    assert.match(block, /readyVisible: false/);
    assert.doesNotMatch(block, /readySelector: "#musa_help_fab"/);
  });
  assert.match(runner, /async function emitAckWithoutPayload[\s\S]*socket\.emit\(eventName, \(response\)/);
  assert.match(runner, /async resolveRoleUrl\(roleName, config\)[\s\S]*emitAckWithoutPayload\(this\.socket, "pedir_opciones_equipo_musa"[\s\S]*searchParams\.set\("session_id", sessionId\)/);
  assert.match(runner, /const roleUrl = await this\.resolveRoleUrl\(roleName, config\);\s+await page\.goto\(roleUrl/);
  assert.match(runner, /config\.readyVisible === false \? \{\} : \{ visible: true \}/);
  assert.match(specs, /"writer1", "#atributos-container", true, "writer1 setup visible"/);
  assert.doesNotMatch(specs, /setNumericInput\("tiempo_votacion"/);
  assert.doesNotMatch(specs, /setNumericInput\("tiempo_modificador"/);
  assert.match(specs, /assertMusaWordInspirationPreview/);
  assert.doesNotMatch(specs, /assertMusaWordTimePreview/);
  assert.match(specs, /waitForQuantifiedInspirationFeedback/);
  assert.doesNotMatch(specs, /waitForTimeAndInspirationFeedback/);
  assert.doesNotMatch(specs, /\\s\*segs\?/);
});

test("E2E waits for every role disconnect before reusing identities in the next spec", () => {
  const runner = read("e2e/runner/index.js");
  const beforeSpec = runner.match(/async beforeSpec\(\) \{[\s\S]*?\n  \}/)?.[0] || "";
  const afterSpec = runner.match(/async afterSpec\(\) \{[\s\S]*?\n  \}/)?.[0] || "";
  const releaseGuard = runner.match(/async waitForRoleConnectionsReleased[\s\S]*?\n  \}/)?.[0] || "";

  assert.match(beforeSpec, /await this\.closeAllPages\(\);\s+await this\.waitForRoleConnectionsReleased\(\);/);
  assert.match(afterSpec, /await this\.closeAllPages\(\);\s+await this\.waitForRoleConnectionsReleased\(\);/);
  assert.match(runner, /async disconnectPageSocket\(entry\)[\s\S]*connectedSocket\.io\.opts\.reconnection = false[\s\S]*connectedSocket\.disconnect\(\)[\s\S]*connectedSocket\.io\.engine\.close\(\)/);
  assert.match(runner, /await Promise\.all\(entries\.map\(\(entry\) => this\.disconnectPageSocket\(entry\)\)\);\s+await Promise\.all\(entries\.map\(\(entry\) => this\.closePageEntry/);
  assert.match(releaseGuard, /\["control", "spectator", "jury", "dramaturgia"\]/);
  assert.match(releaseGuard, /\["writers", "musas", "actors"\]/);
  assert.match(releaseGuard, /await this\.sleep\(300\)/);
});

test("E2E can isolate its socket server from local browser sessions", () => {
  const runner = read("e2e/runner/index.js");

  assert.match(runner, /SCRIB_E2E_SOCKET_PORT \|\| 3000/);
  assert.match(runner, /SCRIB_E2E_STATIC_PORT \|\| 4173/);
  assert.match(runner, /page\.evaluateOnNewDocument\(\(serverUrl\) => \{/);
  assert.match(runner, /Object\.defineProperty\(window, "SERVER_URL_DEV"/);
  assert.match(runner, /`http:\/\/127\.0\.0\.1:\$\{SOCKET_PORT\}`/);
});

test("Smoke prepares a fresh session before asserting that its only Muse is blue", () => {
  const { smokeSpecs } = require("../e2e/specs");
  const spec = smokeSpecs.find(({ name }) => name === "warmup-blue-detonator-delivery").run.toString();
  assert.ok(spec.indexOf('emit("nueva_partida"') < spec.indexOf('ctx, ["musa1"]'));
  assert.match(spec, /response\?\.ok !== true/);
  assert.match(spec, /blueMuse\.team === 1/);
  assert.match(spec, /"writer1"[\s\S]*"blue writer receives the only blue Muse detonator"/);
});

test("Smoke confirms persisted parameters and observes both real point animations", () => {
  const specs = read("e2e/specs/index.js");
  const { smokeSpecs } = require("../e2e/specs");
  const spec = smokeSpecs.find(({ name }) => name === "musa-bonus-delivery").run.toString();
  const configure = specs.slice(specs.indexOf("async function configureFastControlPanel"), specs.indexOf("async function ensureSpectatorView"));
  assert.match(configure, /pageSocket\.on\("control_estado", onState\);\s+window\.emitirEstadoControlPersistente\(\{ inmediato: true \}\)/);
  assert.match(configure, /sameModes\(state\.modos\)/);
  assert.match(configure, /Object\.entries\(expected\.parametros\)/);
  assert.match(configure, /pageSocket\.off\("control_estado", onState\)/);
  assert.ok(spec.indexOf('ctx.evaluate("spectator", startInspirationFeedbackProbe') < spec.indexOf('typeInWriter(ctx, "writer1", " horizonte")'));
  assert.match(spec, /Promise\.all\(/);
  assert.match(spec, /uses\.length === 1 && uses\[0\]\.ack\?\.ok === true/);
  assert.match(spec, /finally[\s\S]*stopInspirationFeedbackProbe/);
});
