const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js');
const {BoardStore}=require('../src/store.js');
function filled(size=3){const b=M.createBoard({size});b.cells.forEach((c,i)=>c.title='事项 '+i);return b;}
function complete(b,indexes){indexes.forEach(i=>M.updateCell(b,b.cells[i].id,{done:true}));}
test('each supported size creates unique cells and an empty board never wins',()=>{
  for(const size of M.SIZES){const b=M.createBoard({size});assert.equal(b.cells.length,size*size);assert.equal(new Set(b.cells.map(c=>c.id)).size,size*size);assert.equal(M.lines(b).length,0);assert.equal(M.stats(b).percent,0);}
});
test('row, column, diagonal and simultaneous lines are detected; undo removes only affected lines',()=>{
  const b=filled();complete(b,[0,1,2,3,6,4,8]);
  assert.deepEqual(M.lines(b).map(l=>l.id).sort(),['c0','d1','d2','r0']);
  M.updateCell(b,b.cells[0].id,{done:false});
  assert.deepEqual(M.lines(b).map(l=>l.id),['d2']);
});
test('all grid sizes have exactly 2n+2 lines on a complete board',()=>{
  for(const n of M.SIZES){const b=filled(n);complete(b,b.cells.map((_,i)=>i));assert.equal(M.lines(b).length,2*n+2);assert.equal(M.stats(b).full,true);}
});
test('empty cells cannot be completed and a cleared cell loses completion',()=>{
  const b=M.createBoard({size:3});M.updateCell(b,b.cells[0].id,{done:true});assert.equal(b.cells[0].done,false);
  M.updateCell(b,b.cells[0].id,{title:'完成',done:true});assert.ok(b.cells[0].doneAt);
  M.updateCell(b,b.cells[0].id,{title:''});assert.equal(b.cells[0].done,false);assert.equal(b.cells[0].doneAt,null);
});
test('serialization round trip preserves Unicode, code fences, dollars, and surrounding user notes',()=>{
  const b=filled();b.title='标题 ``` $&';b.cells[0].note='\n```\n脚本 <script>alert(1)</script> 🌱';
  const text=M.serialize(b)+'\n## 我的笔记\n请保留我。\n';const read=M.parseBoard(text);assert.deepEqual(read,b);
  read.title='修改';const next=M.serialize(read,text);assert.ok(next.endsWith('## 我的笔记\n请保留我。\n'));assert.equal(M.parseBoard(next).title,'修改');
});
test('unknown schema, broken JSON, missing cells, and duplicate ids fail without silent repair',()=>{
  assert.throws(()=>M.parseBoard('unrelated note'));
  assert.throws(()=>M.parseBoard('```bingo-garden-data\n{bad}\n```'));
  const b=filled();b.schema=2;assert.throws(()=>M.serialize(b));b.schema=1;b.cells[1].id=b.cells[0].id;assert.throws(()=>M.validate(b));
});
test('shrinking refuses to lose tasks; expansion keeps ids and progress',()=>{
  const b=filled(4);assert.throws(()=>M.resize(b,3));const id=b.cells[2].id;complete(b,[2]);M.resize(b,6);assert.equal(b.cells.length,36);assert.equal(b.cells[2].id,id);assert.equal(b.cells[2].done,true);
});
test('bulk filling ignores blank lines, never overwrites, and refuses overflow',()=>{
  const b=filled();b.cells[8].title='';assert.throws(()=>M.fillEmpty(b,'a\nb'));assert.equal(b.cells[8].title,'');
  M.fillEmpty(b,'\n- [ ] 新事项\n');assert.equal(b.cells[8].title,'新事项');assert.equal(b.cells[0].title,'事项 0');
});
test('duplicate retains content and rewards but resets progress with fresh identities',()=>{
  const b=filled();b.reward='咖啡';complete(b,[0,1,2]);const c=M.duplicate(b);assert.notEqual(c.id,b.id);assert.equal(c.reward,'咖啡');assert.equal(M.stats(c).done,0);assert.notEqual(c.cells[0].id,b.cells[0].id);assert.equal(c.cells[0].title,b.cells[0].title);
});
test('shuffle is forbidden after completion and preserves cell set before completion',()=>{
  const b=filled();const ids=b.cells.map(c=>c.id).sort();M.shuffle(b,()=>.1);assert.deepEqual(b.cells.map(c=>c.id).sort(),ids);complete(b,[0]);assert.throws(()=>M.shuffle(b));
});
class MemoryVault {
  constructor(){this.files=new Map();}
  getAbstractFileByPath(path){return this.files.get(path)?.file;}
  getMarkdownFiles(){return [...this.files.values()].map(x=>x.file).filter(f=>f.extension==='md');}
  async createFolder(path){this.files.set(path,{file:{path}});}
  async create(path,text){if(this.files.has(path))throw new Error('exists');const file={path,extension:'md'};this.files.set(path,{file,text});return file;}
  async read(file){return this.files.get(file.path).text;}
  async process(file,fn){this.files.get(file.path).text=fn(this.files.get(file.path).text);}
}
test('store applies changes to latest file and preserves edits to other cells',async()=>{
  const v=new MemoryVault(),s=new BoardStore(v);const row=await s.create(filled());const original=await s.read(row.path);
  await s.update(row.path,b=>M.updateCell(b,b.cells[1].id,{title:'来自另一设备'}));
  await s.update(row.path,b=>M.updateCell(b,original.cells[0].id,{done:true},original.cells[0]));
  const read=await s.read(row.path);assert.equal(read.cells[1].title,'来自另一设备');assert.equal(read.cells[0].done,true);
});
test('stale edits on same cell fail, leave data intact, and queue recovers',async()=>{
  const v=new MemoryVault(),s=new BoardStore(v);const row=await s.create(filled());const stale=structuredClone(row.board.cells[0]);
  await s.update(row.path,b=>M.updateCell(b,stale.id,{title:'最新修改'}));
  await assert.rejects(s.update(row.path,b=>M.updateCell(b,stale.id,{title:'旧副本'},stale)),/别处更新/);
  assert.equal((await s.read(row.path)).cells[0].title,'最新修改');
  await s.update(row.path,b=>M.updateCell(b,b.cells[1].id,{done:true}));assert.equal((await s.read(row.path)).cells[1].done,true);
});
test('malformed data is reported and never overwritten',async()=>{
  const v=new MemoryVault(),s=new BoardStore(v);await v.create('Bingo Garden/broken.md','```bingo-garden-data\nBAD\n```');
  assert.ok((await s.list())[0].error);
  await assert.rejects(s.update('Bingo Garden/broken.md',b=>b.title='损坏'));
  assert.equal(await v.read({path:'Bingo Garden/broken.md'}),'```bingo-garden-data\nBAD\n```');
  await assert.rejects(s.read('../some.md'));
});
