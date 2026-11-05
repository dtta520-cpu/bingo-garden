const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js');
test('bulk and quick entry match task content and vary repeated categories',()=>{
  const b=M.createBoard({size:3});
  M.fillEmpty(b,'读十页书\n散步 20 分钟\n工作项目\n给植物浇水\n阅读论文\n看书\n喝水\n整理桌面\n处理邮件');
  assert.deepEqual(b.cells.map(c=>c.emoji),['📖','🏃','💻','🪴','📚','📔','💧','🧹','💌']);
  assert.ok(b.cells.every(c=>c.emojiMode==='auto'));
});
test('36 uncategorized tasks get different stored icons without external services',()=>{
  const b=M.createBoard({size:6});M.fillEmpty(b,Array(36).fill('普通事项').join('\n'));
  assert.equal(new Set(b.cells.map(c=>c.emoji)).size,36);
  const icons=b.cells.map(c=>c.emoji);const loaded=M.parseBoard(M.serialize(b));
  for(const c of loaded.cells)M.updateCell(loaded,c.id,{done:true});
  assert.deepEqual(loaded.cells.map(c=>c.emoji),icons);
});
test('automatic icons follow a renamed task while custom icons stay chosen',()=>{
  const b=M.createBoard({size:3}),c=b.cells[0];
  M.updateCell(b,c.id,{title:'读书'});assert.equal(c.emoji,'📖');
  M.updateCell(b,c.id,{title:'运动'});assert.equal(c.emoji,'🏋️');
  M.updateCell(b,c.id,{emoji:'🦊'});assert.equal(c.emojiMode,'manual');
  M.updateCell(b,c.id,{title:'喝咖啡'});assert.equal(c.emoji,'🦊');
  M.updateCell(b,c.id,{emojiMode:'auto'});assert.equal(c.emoji,'☕');
});
test('legacy populated icons remain untouched and legacy empty default cells become automatic',()=>{
  const b=M.createBoard({size:3});b.cells.forEach(c=>delete c.emojiMode);
  b.cells[0].title='老事项';b.cells[1].title='自选';b.cells[1].emoji='💎';
  M.updateCell(b,b.cells[0].id,{done:true});assert.equal(b.cells[0].emoji,'🌱');
  M.updateCell(b,b.cells[1].id,{title:'读书'});assert.equal(b.cells[1].emoji,'💎');
  M.fillEmpty(b,'散步');assert.equal(b.cells[2].emoji,'🏃');
  assert.doesNotThrow(()=>M.parseBoard(M.serialize(b)));
});
test('changing completion or notes does not rebalance existing icons',()=>{
  const b=M.createBoard({size:3});M.fillEmpty(b,'阅读\n读书');const c=b.cells[1];
  M.updateCell(b,b.cells[0].id,{title:''});
  M.updateCell(b,c.id,{done:true,note:'保留'});assert.equal(c.emoji,'📚');
  assert.equal(M.duplicate(b).cells[1].emoji,'📚');
});
test('overflow and stale edits do not partially change icons',()=>{
  const b=M.createBoard({size:3});M.fillEmpty(b,'读书');const stale=structuredClone(b.cells[0]);
  const original=structuredClone(b);assert.throws(()=>M.fillEmpty(b,Array(9).fill('散步').join('\n')));assert.deepEqual(b,original);
  M.updateCell(b,stale.id,{title:'工作'});assert.throws(()=>M.updateCell(b,stale.id,{title:'喝水'},stale),/别处更新/);assert.equal(b.cells[0].emoji,'💻');
});
test('unknown icon modes are rejected instead of silently changing custom icons',()=>{
  const b=M.createBoard();b.cells[0].emojiMode='unknown';assert.throws(()=>M.validate(b));
});
