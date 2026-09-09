const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");
const ARCHIVE = path.join(ROOT, "archivo");
const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE, "data", "textos.json"), "utf8"));

test("the public archive exposes every imported Sutura text", () => {
  assert.equal(data.count, 31);
  assert.equal(data.entries.length, data.count);
  assert.equal(new Set(data.entries.map((entry) => entry.id)).size, data.count);

  for (const entry of data.entries) {
    assert.ok(entry.author.trim(), `${entry.id} has no author`);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.text.length > 80, `${entry.id} has no readable text`);
    assert.ok(entry.wordCount > 10, `${entry.id} has an invalid word count`);
    assert.doesNotMatch(entry.text, /INFORME DE PARTIDA/i);
    assert.match(entry.pdf, /^pdf\/[a-z0-9-]+\.pdf$/);
  }
});

test("each archive entry has a downloadable branded PDF", () => {
  for (const entry of data.entries) {
    const pdfPath = path.join(ARCHIVE, entry.pdf);
    assert.ok(fs.existsSync(pdfPath), `${entry.pdf} is missing`);
    assert.equal(fs.readFileSync(pdfPath).subarray(0, 5).toString(), "%PDF-");
  }
});

test("the archive supports in-browser reading, filtering and direct links", () => {
  const html = fs.readFileSync(path.join(ARCHIVE, "index.html"), "utf8");
  const source = fs.readFileSync(path.join(ARCHIVE, "archivo.js"), "utf8");
  const styles = fs.readFileSync(path.join(ARCHIVE, "archivo.css"), "utf8");

  assert.match(html, /<dialog[^>]+id="reader-dialog"/);
  assert.match(html, /LEER EN EL NAVEGADOR/);
  assert.match(html, /DESCARGAR EN FORMATO &lt;SCRI&gt; B/);
  assert.match(html, /id="archive-search"[^>]+type="search"/);
  assert.match(source, /fetch\("\.\/data\/textos\.json"\)/);
  assert.match(source, /searchParams\.set\("texto", entry\.id\)/);
  assert.match(source, /entry\.text\.split/);
  assert.match(styles, /@media\(max-width:680px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(styles, /rgba\(255,255,,/);
});

test("the main terminal links the archivo command and its aliases", () => {
  const source = fs.readFileSync(path.join(ROOT, "js", "main.js"), "utf8");
  const netlify = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");

  assert.match(source, /ARCHIVO: \{ value: "archivo"/);
  assert.match(source, /case "textos":[\s\S]*case "historias":/);
  assert.match(source, /window\.location\.assign\("\.\/archivo\/"\)/);
  assert.match(netlify, /from = "\/archivo"[\s\S]*to = "\/archivo\/"/);
});
