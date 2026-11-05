const fs=require('node:fs');
const path=require('node:path');
const modules=['model','store','celebration','ui','main'];
const bodies=modules.map(id=>JSON.stringify('./'+id+'.js')+':function(module,exports,require){\n'+fs.readFileSync(path.join(__dirname,'src',id+'.js'),'utf8')+'\n}').join(',\n');
const loader='const modules={'+bodies+'};\nconst cache={};\nfunction load(id){if(id==="obsidian")return require("obsidian");if(cache[id])return cache[id].exports;if(!modules[id])throw new Error("Unknown module: "+id);const m={exports:{}};cache[id]=m;modules[id](m,m.exports,load);return m.exports;}\nmodule.exports=load("./main.js");\n';
fs.writeFileSync(path.join(__dirname,'main.js'),'/* Bingo Garden '+require('./manifest.json').version+' | MIT | Built from included source. */\n'+loader);
console.log('Built main.js (no runtime dependencies beyond the Obsidian API).');
