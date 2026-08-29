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
