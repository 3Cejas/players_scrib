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
