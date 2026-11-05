const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=require('../manifest.json');
assert.equal(manifest.id,'bingo-garden');
assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
assert.equal(manifest.version,require('../package.json').version);
assert.equal(require('../versions.json')[manifest.version],manifest.minAppVersion);
assert.ok(manifest.description.length<=250&&manifest.description.endsWith('.'));
assert.ok(manifest.author&&manifest.authorUrl);
for(const file of ['main.js','manifest.json','styles.css','README.md','LICENSE'])assert.ok(fs.statSync(path.join(root,file)).size>0,file);
for(const file of ['model','store','celebration','ui','main']){
  const source=fs.readFileSync(path.join(root,'src',file+'.js'),'utf8');
  assert.ok(!/require\(['"](?:node:|fs['"]|electron['"])/.test(source),'Desktop-only runtime dependency: '+file);
}
console.log('Release metadata and runtime files validated: '+manifest.version);
