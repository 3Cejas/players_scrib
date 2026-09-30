const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "game/control/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "game/control/tablet.css"), "utf8");

test("Control loads its touch layout after desktop and vendor styles", () => {
  assert.match(html, /tablet\.css\?v=20260930a/);
  assert.ok(html.indexOf("tablet.css") > html.indexOf("mtr-datepicker.default-theme.min.css"));
  assert.match(css, /@media \(max-width: 1100px\), \(any-pointer: coarse\) and \(max-width: 1600px\)/);
  assert.match(css, /\.remote-status-bar\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important;[^}]*height: auto;/);
  assert.match(css, /table\.default\.parametros-colapsados\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) !important;[^}]*height: auto !important;/);
});

test("Control touch targets cannot shrink with viewport width", () => {
  assert.match(css, /\.spinner-button\s*\{[^}]*min-width: 44px;[^}]*min-height: 44px;/);
  assert.match(css, /\.teleprompter-host \.tp-btn\s*\{[^}]*min-width: 48px;[^}]*min-height: 48px;[^}]*touch-action: none;/);
  assert.match(css, /control-tab\.control-collapsible-toggle\s*\{[^}]*width: auto;[^}]*max-width: none;[^}]*min-height: 48px;/);
  assert.match(css, /\.control-tabs-shell\s*\{[^}]*grid-template-columns: 44px minmax\(0, 1fr\) 44px;/);
  assert.match(css, /is-side-collapsed \.control-params-title-text\s*\{[^}]*writing-mode: horizontal-tb;/);
});
