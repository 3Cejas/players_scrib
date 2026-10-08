const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', dataset: {}, events: {}, open: false,
      addEventListener(event, fn) { this.events[event] = fn; },
      replaceChildren(...children) { this.options = children; },
      showModal() { this.open = true; }, close() { this.open = false; }
    });
    return elements.get(id);
  };
  const pending = [], listeners = {}, applied = [];
  const socket = {connected: true, on: (event, fn) => {listeners[event] = fn;}, emit: (event, data, cb) => pending.push({event, data, cb})};
  const window = {aplicarConfiguracionBoloControl: result => applied.push(result)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game/control/js/bolo-configuration-control.js'), 'utf8'), {
    document: {getElementById: el}, window, socket, setTimeout, clearTimeout, Intl, Date,
    Option: function(text, value) {this.text = text; this.value = value;}
  });
  return {el, pending, listeners, applied, window};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const profile = (extra = {}) => ({id:'bolo-1', revision:'a'.repeat(64), title:'Función de prueba', start:'2026-11-07', ready:true,
  nombres:{1:'ÁNGELA',2:'PABLO'}, elenco:[], errors:[], warnings:[], config:{parametros:{duracion_minutos:35,duracion_segundos:0,limite_tiempo_inspiracion:10}, modos:['tertulia'], idioma:'es', frases_finales:{}}, ...extra});

test('Control previews a bolo, passes both revisions and applies only a confirmed reply', async () => {
  const f = fixture();
  f.listeners.control_estado({revision:7});
  f.window.abrirConfiguracionBoloControl();
  assert.equal(f.el('bolo_config_dialog').open,true);
  assert.equal(f.pending[0].event,'bolos_configuracion_listar');
  f.pending.shift().cb({ok:true,bolos:[profile()]}); await tick();
  f.el('bolo_config_select').value='bolo-1'; f.el('bolo_config_select').events.change();
  assert.equal(f.el('bolo_config_apply').disabled,false);
  f.el('bolo_config_apply').events.click();
  assert.equal(f.applied.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(f.pending[0].data)),{id:'bolo-1',revision:'a'.repeat(64),controlRevision:7});
  f.pending.shift().cb({ok:true,control:{revision:8,bolo:{title:'Función de prueba',start:'2026-11-07'}},creditos:{}}); await tick();
  assert.equal(f.applied.length,1);
  assert.match(f.el('bolo_config_status').textContent,/Configuración cargada/);
  assert.match(f.el('bolo_config_active').textContent,/Función de prueba/);
});

test('incomplete profiles cannot load, and names/notes are escaped in the preview', async () => {
  const f = fixture(); f.window.abrirConfiguracionBoloControl();
  f.pending.shift().cb({ok:true,bolos:[profile({title:'<img onerror=bad>', ready:false, errors:['Falta <escritora>']})]}); await tick();
  f.el('bolo_config_select').value='bolo-1'; f.el('bolo_config_select').events.change();
  assert.equal(f.el('bolo_config_apply').disabled,true);
  assert.match(f.el('bolo_config_preview').innerHTML,/&lt;img onerror=bad&gt;/);
  assert.doesNotMatch(f.el('bolo_config_preview').innerHTML,/<img/);
  f.el('bolo_config_apply').events.click();
  assert.equal(f.pending.length,0);
  assert.equal(f.applied.length,0);
});

test('a rejected active-match import leaves the current configuration untouched', async () => {
  const f = fixture(); f.window.abrirConfiguracionBoloControl();
  f.pending.shift().cb({ok:true,bolos:[profile()]}); await tick();
  f.el('bolo_config_select').value='bolo-1'; f.el('bolo_config_select').events.change();
  f.el('bolo_config_apply').events.click();
  f.pending.shift().cb({ok:false,error:'Finaliza la partida antes de cargar otro bolo.'}); await tick();
  assert.equal(f.applied.length,0);
  assert.equal(f.el('bolo_config_status').dataset.error,'1');
  assert.match(f.el('bolo_config_status').textContent,/Finaliza la partida/);
});
