const fs=require('node:fs');const path=require('node:path');
const base=path.resolve(__dirname,'..');
const sources=['model','store','celebration','ui'].map(id=>JSON.stringify('./'+id+'.js')+':function(module,exports,require){'+fs.readFileSync(path.join(base,'src',id+'.js'),'utf8')+'\n}').join(',');
const js=`const modules={${sources}};const cache={};function load(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](m,m.exports,load);return m.exports;}
const {GardenScreen,el,button}=load('./ui.js');const {BoardStore}=load('./store.js');
const key='bingo-garden-preview-v1';let data;try{data=JSON.parse(localStorage.getItem(key)||'{}')}catch{data={}}
function persist(){localStorage.setItem(key,JSON.stringify(data));}
const vault={getMarkdownFiles:()=>Object.keys(data).filter(p=>p.endsWith('.md')).map(path=>({path,extension:'md'})),getAbstractFileByPath:path=>path in data?{path,extension:path.endsWith('.md')?'md':undefined}:null,
 read:async file=>data[file.path],createFolder:async path=>{data[path]='';persist()},create:async(path,text)=>{if(path in data)throw Error('文件已存在');data[path]=text;persist()},process:async(file,fn)=>{data[file.path]=fn(data[file.path]);persist()}};
const notices=document.querySelector('#notices');
const host={store:new BoardStore(vault),notice:message=>{const n=el(notices,'div','preview-notice',message);setTimeout(()=>n.remove(),6500)},
 dialog:(title,build)=>{const modal=el(document.body,'dialog','bg-modal');const closer=()=>modal.close();el(modal,'h2','modal-title',title);build(modal,closer);modal.addEventListener('close',()=>modal.remove());modal.showModal();},
 openFile:async path=>{host.dialog('棋盘文件预览',(root,close)=>{const p=el(root,'pre','',data[path]);p.style.whiteSpace='pre-wrap';p.style.maxHeight='50vh';p.style.overflow='auto';button(root,'关闭','bg-btn bg-primary',close)})}};
window.screenApp=new GardenScreen(document.querySelector('#garden'),host);window.model=load('./model.js');window.previewHost=host;window.previewData=()=>data;window.screenApp.refresh();
document.querySelector('#dark').onclick=()=>document.body.classList.toggle('theme-dark');
window.addEventListener('storage',e=>{if(e.key===key){data=JSON.parse(e.newValue||'{}');window.screenApp.refresh()}});`;
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8');
const html=`<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bingo 花园 · 交互预览</title><style>
html,body{margin:0;height:100%;font-family:"Segoe UI","Microsoft YaHei",sans-serif;background:#fbf8f2}body{display:flex;flex-direction:column}.preview-bar{background:#34352e;color:#fff;padding:8px 15px;display:flex;justify-content:space-between;gap:8px;font-size:11px;line-height:1.5}.preview-bar button{background:none;border:1px solid #fff6;border-radius:5px;color:#fff;font-size:11px;cursor:pointer;white-space:nowrap}#garden{flex:1;min-height:0}.bg-modal{padding:26px;border:1px solid #ddd;box-sizing:border-box}.bg-modal::backdrop{background:#191a1766;backdrop-filter:blur(3px)}.bg-modal h2{margin:0 0 15px}#notices{position:fixed;right:18px;bottom:18px;z-index:999;max-width:calc(100vw - 36px)}.preview-notice{background:#34352e;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 6px 30px #0003;margin-top:10px;font-size:13px}${css}</style>
<body><div class="preview-bar"><span>交互预览 · 数据仅在当前浏览器保存，与 Obsidian 笔记库不互通</span><button id="dark">切换明暗</button></div><main id="garden"></main><div id="notices" role="status"></div><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
fs.writeFileSync(path.join(base,'preview.html'),html);
console.log('Built standalone preview using the same UI and data operations as the plugin.');
