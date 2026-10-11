const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function destination(pathname,search=''){
  let destination=null;
  const location={pathname,search,replace:url=>destination=url};
  vm.runInNewContext(read('game/js/laboratory-redirect.js'),{location,URL,URLSearchParams});
  return destination;
}

test('legacy public and self-hosted game links lead to the private laboratory',()=>{
  for(const prefix of ['/game','/scrib']){
    assert.equal(destination(prefix+'/bolzano/'),'https://sutura-gateway.ddns.net/scrib/backstage/laboratory/bolzano/');
    assert.equal(destination(prefix+'/s7/index.html'),'https://sutura-gateway.ddns.net/scrib/#experiment/s7');
    const target=new URL(destination(prefix+'/bolzano/musa.html','?player=2&modo=musa&next=https://example.com/&extra=secret'));
    assert.equal(target.search,'?modo=musa&player=2');
    assert.equal(target.origin,'https://sutura-gateway.ddns.net');
    assert.equal(destination(prefix+'/bolzano/index.html','?modo=bad&player=9'),'https://sutura-gateway.ddns.net/scrib/backstage/laboratory/bolzano/');
  }
  assert.equal(destination('/unknown/'),null);
});
test('old pages contain only redirects, not playable public engines',()=>{
  for(const file of ['game/bolzano/index.html','game/bolzano/musa.html','game/s7/index.html']){
    const html=read(file);
    assert.match(html,/<script src="\.\.\/js\/laboratory-redirect\.js"><\/script><noscript><meta http-equiv="refresh"/);
    assert.doesNotMatch(html,/script defer|js\/index\.js|js\/musa\.js|s7-engine|socket\.io|<textarea|<input/);
  }
  for(const file of ['game/bolzano/js/index.js','game/bolzano/js/musa.js','game/bolzano/js/events.js','game/s7/js/index.js','game/s7/js/s7-engine.js'])assert.equal(fs.existsSync(path.join(root,file)),false);
  const redirects=read('netlify.toml');
  for(const command of ['charla','tutorial'])assert.match(redirects,new RegExp(`from = "/${command}\\/\\*"[\\s\\S]*?to = "https://sutura-gateway.ddns.net/scrib/#material/${command}"`));
});
