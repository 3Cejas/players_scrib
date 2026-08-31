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

test("Control recovers from credentials invalidated by a server restart", () => {
  const source = read("game/control/js/socket-events.js");
  const redirect = source.match(/function redirigirASelectorRolesControl\(code\) \{[\s\S]*?\n\}/)?.[0] || "";
  const html = read("game/control/index.html");

  assert.match(source, /CONTROL_ACCESS_REJECTION_CODES = new Set\(\[[\s\S]*ACCESS_TOKEN_REQUIRED[\s\S]*INVALID_ACCESS_TOKEN[\s\S]*ACCESS_TOKEN_EXPIRED/);
  assert.match(source, /redireccion_acceso_control_pendiente/);
  assert.match(redirect, /esReplicaDramaturgiaControl\(\)/);
  assert.match(redirect, /limpiarAccessTokenControl\(\)/);
  assert.match(redirect, /new URL\("\.\.\/index\.html", window\.location\.href\)/);
  assert.match(redirect, /window\.location\.replace\(destino\.href\)/);
  assert.match(source, /redirigirASelectorRolesControl\(code\)/);
  assert.match(html, /socket-events\.js\?v=20260831c/);
});

test("an active Control session renews its signed credential without leaving the role", () => {
  const source = read("game/control/js/socket-events.js");

  assert.match(source, /CONTROL_ACCESS_EXPIRES_KEY = "scrib_roles_access_expires_ts"/);
  assert.match(source, /CONTROL_ACCESS_RENEW_MAX_DELAY_MS = 30 \* 60 \* 1000/);
  assert.match(source, /function guardarAccessTokenControl\(payload = \{\}\)[\s\S]*sessionStorage\.setItem\(CONTROL_ACCESS_TOKEN_KEY, token\)[\s\S]*sessionStorage\.setItem\(CONTROL_ACCESS_EXPIRES_KEY, String\(expiresTs\)\)/);
  assert.match(source, /function programarRenovacionAccesoControl\(expiresTs\)[\s\S]*Math\.floor\(restante \/ 2\)[\s\S]*renovarAccesoControl\(\)/);
  assert.match(source, /function renovarAccesoControl\(\)[\s\S]*socket\.emit\('registrar_control',[\s\S]*renovacion: true[\s\S]*procesarRegistroControl/);
  assert.match(source, /if \(respuesta\.ok === true\)[\s\S]*guardarAccessTokenControl\(respuesta\);[\s\S]*programarRenovacionAccesoControl\(respuesta\.expires_ts\);[\s\S]*sincronizarControlAutorizado\(\)/);
  assert.match(source, /socket\.on\('disconnect',[\s\S]*cancelarRenovacionAccesoControl\(\)/);
});
