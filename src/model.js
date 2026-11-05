const SIZES = [3, 4, 5, 6];
const THEMES = ['peach', 'sage', 'lavender'];
const FENCE = /^```bingo-garden-data\r?\n([\s\S]*?)\r?\n```[ \t]*$/m;
const now = () => new Date().toISOString();
function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
function cell() { return { id: uid(), title: '', emoji: '🌱', emojiMode: 'auto', note: '', done: false, doneAt: null }; }
const ICON_RULES = [
  [/喝水|饮水|温水|\bwater\b/i,['💧','🥤']],
  [/咖啡|喝茶|奶茶|\bcoffee\b|\btea\b/i,['☕','🍵','🫖']],
  [/读书|阅读|看书|读.{0,6}[页本章]|\bread(?:ing)?\b|\bbooks?\b/i,['📖','📚','📔','📘']],
  [/跑步|散步|走路|快走|\brun(?:ning)?\b|\bwalk(?:ing)?\b/i,['🏃','👟','🚶']],
  [/健身|运动|锻炼|训练|\bworkout\b|\bexercise\b|\bgym\b/i,['🏋️','💪','🏅']],
  [/瑜伽|冥想|伸展|拉伸|\byoga\b|\bmeditat/i,['🧘','🌿','🪷']],
  [/睡|休息|早起|\bsleep\b|\brest\b/i,['🌙','🛌','💤']],
  [/浇水|植物|园艺|种花|\bplants?\b|\bgarden/i,['🪴','🌱','🌻']],
  [/水果|苹果|香蕉|\bfruit\b/i,['🍎','🍊','🍌']],
  [/做饭|做菜|烹饪|早餐|午餐|晚餐|\bcook|\bmeal\b/i,['🍳','🥗','🍲']],
  [/打扫|清洁|洗衣|洗碗|收拾|整理桌面|整理房间|抽屉|\bclean/i,['🧹','🧺','🧽']],
  [/资料|文件|下载|归档|整理|\bfiles?\b|\borganize\b/i,['📂','🗂️','🗃️']],
  [/邮件|邮箱|\bemail\b|\bmail\b/i,['💌','📨','📬']],
  [/电话|打给|通话|\bcall\b|\bphone\b/i,['📞','☎️']],
  [/朋友|家人|聊天|消息|联系|\bfriends?\b|\bchat\b/i,['💬','🤝','💌']],
  [/会议|开会|面谈|拜访|访谈|\bmeeting\b/i,['🗓️','🤝','📝']],
  [/报告|汇报|写作|写下|复盘|笔记|日记|\bwrite\b|\breport\b|\bjournal\b/i,['📝','✍️','📋']],
  [/学习|课程|考试|复习|单词|知识|\bstudy\b|\blearn/i,['🎓','🧠','📚']],
  [/研究|调研|分析|\bresearch\b|\banalysis\b/i,['🔎','🔬','📊']],
  [/代码|编程|开发|修复|项目|工作|\bcode\b|\bwork\b|\bproject\b/i,['💻','⌨️','🛠️']],
  [/计划|规划|安排|重点|目标|\bplan\b|\bgoals?\b/i,['🎯','📅','🧭']],
  [/音乐|听歌|听.{0,4}歌|弹琴|\bmusic\b|\bsong\b/i,['🎵','🎧','🎶']],
  [/画画|绘画|设计|手工|\bdraw\b|\bdesign\b/i,['🎨','🖌️','✂️']],
  [/购物|买|采购|\bshop|\bbuy\b/i,['🛍️','🛒','🎁']],
  [/旅行|旅游|出行|机票|\btravel\b|\btrip\b/i,['🧳','✈️','🗺️']],
  [/晒太阳|户外|出门|公园|\boutdoor/i,['☀️','🌳','🌤️']],
  [/灵感|创意|\bidea\b/i,['💡','✨','💭']],
  [/奖励|庆祝|开心|\breward\b|\bcelebrat/i,['🎁','🎉','🎈']]
];
const VARIED_ICONS=['✨','⭐','🌈','🍀','🌻','🌸','🌼','🪴','🌵','🍃','🌊','☀️','🌙','☁️','🔥','⚡','💫','🦋','🐝','🐢','🐱','🐶','🦊','🐧','🦉','🪁','🎈','🎉','🎁','🎨','🎵','🧩','🎲','🎯','💡','🗝️','🔔','💎','🧭','🚀','🪐','🏔️','🏝️'];
function iconMode(c) {return c.emojiMode||(!c.title.trim()&&c.emoji==='🌱'?'auto':'manual');}
function suggestEmoji(title,board,cellId) {
  if(!title.trim())return '🌱';
  const match=ICON_RULES.find(([pattern])=>pattern.test(title));
  let choices=match?.[1]||VARIED_ICONS;
  if(!match){let hash=0;for(const char of title)hash=(Math.imul(hash,31)+char.codePointAt(0))>>>0;const start=hash%choices.length;choices=choices.slice(start).concat(choices.slice(0,start));}
  const counts=new Map();
  for(const c of board.cells)if(c.id!==cellId&&c.title.trim())counts.set(c.emoji,(counts.get(c.emoji)||0)+1);
  return choices.reduce((best,icon)=>(counts.get(icon)||0)<(counts.get(best)||0)?icon:best,choices[0]);
}
function validate(board) {
  const str = (v) => typeof v === 'string';
  if (!board || board.schema !== 1 || !str(board.id) || !board.id || !str(board.title) || !board.title.trim() ||
      !SIZES.includes(board.size) || !THEMES.includes(board.theme) || !str(board.reward) ||
      typeof board.archived !== 'boolean' || !str(board.createdAt) || !str(board.updatedAt) ||
      !Array.isArray(board.cells) || board.cells.length !== board.size ** 2) throw new Error('棋盘格式不受支持或数据不完整；原文件未被修改。');
  const ids = new Set();
  for (const c of board.cells) {
    if (!c || !str(c.id) || !c.id || ids.has(c.id) || !str(c.title) || !str(c.emoji) || !str(c.note) ||
        typeof c.done !== 'boolean' || !(c.doneAt === null || str(c.doneAt)) || (c.done && !c.title.trim()) ||
        (c.emojiMode!==undefined&&!['auto','manual'].includes(c.emojiMode))) {
      throw new Error('格子数据不完整；原文件未被修改。');
    }
    ids.add(c.id);
  }
  return board;
}
function createBoard({title = '我的小小进展', size = 5, theme = 'peach', reward = ''} = {}) {
  if (!SIZES.includes(size)) throw new Error('请选择 3×3 至 6×6 的棋盘。');
  const date = now();
  return validate({schema: 1, id: uid(), title: title.trim() || '我的小小进展', size, theme, reward: reward.trim(), archived: false,
    createdAt: date, updatedAt: date, cells: Array.from({length: size ** 2}, cell)});
}
function parseBoard(text) {
  const match = text.match(FENCE);
  if (!match) throw new Error('未找到完整的 Bingo 数据块；原文件未被修改。');
  let board;
  try { board = JSON.parse(match[1]); } catch { throw new Error('Bingo 数据无法读取，请检查同步冲突或从备份恢复；原文件未被修改。'); }
  return validate(board);
}
function serialize(board, existing) {
  validate(board);
  // Prevent titles or notes containing a code fence from escaping the data block.
  const json = JSON.stringify(board, null, 2).replace(/`/g, '\\u0060');
  const block = '```bingo-garden-data\n' + json + '\n```';
  if (existing !== undefined) {
    if (!FENCE.test(existing)) throw new Error('原数据块已变化；停止写入。');
    return existing.replace(FENCE, () => block);
  }
  return '---\nbingo-garden: 1\n---\n\n' + block + '\n\n<!-- 棋盘由 Bingo Garden 管理。你可以在这条注释下添加笔记。 -->\n';
}
function lines(board) {
  const n = board.size;
  const candidates = [];
  for (let i=0;i<n;i++) {
    candidates.push({id: `r${i}`, label: `第 ${i+1} 行`, indexes: Array.from({length:n}, (_,j)=>i*n+j)});
    candidates.push({id: `c${i}`, label: `第 ${i+1} 列`, indexes: Array.from({length:n}, (_,j)=>j*n+i)});
  }
  candidates.push({id:'d1',label:'左上对角线',indexes:Array.from({length:n},(_,i)=>i*n+i)},
    {id:'d2',label:'右上对角线',indexes:Array.from({length:n},(_,i)=>i*n+(n-1-i))});
  return candidates.filter(l=>l.indexes.every(i=>board.cells[i].title.trim() && board.cells[i].done));
}
function stats(board) {
  const filled = board.cells.filter(c=>c.title.trim()).length;
  const done = board.cells.filter(c=>c.title.trim() && c.done).length;
  const wins = lines(board);
  return {filled, done, total:board.cells.length, wins, percent: filled ? Math.round(done/filled*100):0,
    full: done === board.cells.length};
}
function updateCell(board, id, changes, expected) {
  const c = board.cells.find(c=>c.id===id);
  if (!c) throw new Error('这个格子已被删除或棋盘尺寸已改变，请重新打开。');
  if (expected && JSON.stringify(c) !== JSON.stringify(expected)) throw new Error('此格子已在别处更新。已保留最新内容，请重新打开格子再修改。');
  const previousTitle=c.title,previousMode=iconMode(c);
  const mode=changes.emojiMode||('emoji' in changes?(changes.emoji.trim()?'manual':'auto'):previousMode);
  for (const key of ['title','emoji','note','done']) if (key in changes) c[key] = changes[key];
  c.title = c.title.trim();c.emojiMode=mode;
  if(mode==='auto'&&(c.title!==previousTitle||mode!==previousMode||!c.emoji.trim()))c.emoji=suggestEmoji(c.title,board,c.id);
  c.emoji = c.emoji.trim() || '🌱';
  if (!c.title) { c.done = false; c.note = ''; }
  c.doneAt = c.done ? c.doneAt || now() : null;
  board.updatedAt = now();
  return validate(board);
}
function resize(board, size) {
  if (!SIZES.includes(size)) throw new Error('不支持的棋盘尺寸。');
  if (size === board.size) return board;
  const occupied = board.cells.filter(c=>c.title.trim() || c.note.trim());
  if (occupied.length > size ** 2) throw new Error(`已有 ${occupied.length} 项内容，不能缩小到 ${size ** 2} 格。请先整理格子。`);
  board.cells = occupied.concat(Array.from({length: size**2 - occupied.length}, cell));
  board.size = size; board.updatedAt = now();
  return validate(board);
}
function fillEmpty(board, text) {
  const tasks = text.split(/\r?\n/).map(s=>s.replace(/^\s*(?:[-*]\s*\[[ xX]\]\s*|[-*]\s+|\d+[.)、]\s*)/, '').trim()).filter(Boolean);
  const empty = board.cells.filter(c=>!c.title.trim() && !c.note.trim());
  if (!tasks.length) throw new Error('请每行输入一个事项。');
  if (tasks.some(t=>t.length > 160)) throw new Error('单个事项请控制在 160 字以内。');
  if (tasks.length > empty.length) throw new Error(`还有 ${empty.length} 个空格，但输入了 ${tasks.length} 项；请减少事项或换更大的棋盘。`);
  tasks.forEach((title,i)=>{updateCell(board,empty[i].id,{title});});
  board.updatedAt = now();
  return board;
}
function shuffle(board, random = Math.random) {
  if (board.cells.some(c=>c.done)) throw new Error('已有完成记录，为保留连线进度，当前棋盘不能打乱。可以复制成新一轮。');
  for (let i=board.cells.length-1;i>0;i--) {
    const j = Math.floor(random()*(i+1));
    [board.cells[i],board.cells[j]]=[board.cells[j],board.cells[i]];
  }
  board.updatedAt = now(); return board;
}
function duplicate(board, title) {
  const copy = createBoard({title: title || `${board.title} · 新一轮`,size:board.size,theme:board.theme,reward:board.reward});
  copy.cells=board.cells.map(c=>({...c,id:uid(),done:false,doneAt:null}));
  return copy;
}
module.exports = {SIZES, THEMES, now, uid, cell, validate, createBoard, parseBoard, serialize, lines, stats, updateCell, resize, fillEmpty, shuffle, duplicate, iconMode, suggestEmoji};
