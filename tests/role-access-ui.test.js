const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("protected-role menu persists only a live temporary server credential", () => {
  const html = read("game/index.html");

  assert.match(html, /ACCESS_TOKEN_KEY = "scrib_roles_access_token"/);
  assert.match(html, /ACCESS_TOKEN_EXPIRES_KEY = "scrib_roles_access_expires_ts"/);
  assert.match(html, /expiresTs > Date\.now\(\)/);
  assert.match(html, /response && response\.access_token/);
  assert.match(html, /response && response\.expires_ts/);
  assert.match(html, /sessionStorage\.setItem\(ACCESS_TOKEN_KEY, token\)/);
  assert.match(html, /sessionStorage\.setItem\(ACCESS_TOKEN_EXPIRES_KEY, String\(expiresTs\)\)/);
  assert.match(html, /limpiarAccesoRoles\(\)/);
  assert.doesNotMatch(html, /sessionStorage\.setItem\([^,]+,\s*pwd\)/);
});

test("Control waits for server authorization while dramaturgy replicas stay read-only", () => {
  const source = read("game/control/js/socket-events.js");
  const authorizedSync = source.match(/function sincronizarControlAutorizado\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const monitorSync = source.match(/function sincronizarReplicaControlSoloLectura\(\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /sessionStorage\.getItem\(CONTROL_ACCESS_TOKEN_KEY\)/);
  assert.match(source, /socket\.emit\('registrar_control', \{ access_token: accessToken \}, procesarRegistroControl\)/);
  assert.match(source, /socket\.on\('control_registro_estado'/);
  assert.match(source, /ACCESS_TOKEN_REQUIRED|INVALID_ACCESS_TOKEN|ACCESS_TOKEN_EXPIRED/);
  assert.match(authorizedSync, /pedir_ayuda_musas_estado/);
  assert.match(authorizedSync, /ScribMuseHelpControl\.marcarConexion\(true\)/);
  assert.match(monitorSync, /data-controlAccess = "monitor"|dataset\.controlAccess = "monitor"/);
  assert.match(monitorSync, /ScribMuseHelpControl\.marcarConexion\(false\)/);
  assert.doesNotMatch(monitorSync, /pedir_ayuda_musas_estado|iniciarStatsLiveControl/);
});
