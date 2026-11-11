const M = require('./model.js');
const {BingoCelebration}=require('./celebration.js');
function el(parent,tag,cls,text) {
  const node=parent.ownerDocument.createElement(tag);
  if(cls) node.className=cls;
  if(text!==undefined) node.textContent=text;
  parent.appendChild(node); return node;
}
function button(parent,label,cls,fn) {
  const b=el(parent,'button',cls,label); b.type='button';
  b.addEventListener('click',fn); return b;
}
function field(parent,label,value,tag='input') {
  const wrap=el(parent,'label','bg-field');
  el(wrap,'span','bg-field-label',label);
  const input=el(wrap,tag,'bg-input'); input.value=value||'';
  input.setAttribute('aria-label',label);
  return input;
}
function select(parent,label,value,options) {
  const s=field(parent,label,value,'select');
  for(const [v,t] of options) { const o=el(s,'option','',t);o.value=v; }
  s.value=String(value);return s;
}
function themePicker(parent,current) {
  const wrap=el(parent,'div','bg-theme-picker');
  wrap.setAttribute('role','group');wrap.setAttribute('aria-label','棋盘配色');
  let value=current;
  for(const [theme,name] of [['peach','杏桃奶油'],['sage','鼠尾草绿'],['lavender','薰衣草紫']]) {
    const b=button(wrap,name,`bg-swatch bg-${theme}`,()=>{value=theme;for(const child of wrap.children) child.setAttribute('aria-pressed',String(child===b));});
    b.setAttribute('aria-pressed',String(current===theme));
  }
  return ()=>value;
}
function formActions(container,close,submit,label='保存') {
  const error=el(container,'p','bg-form-error');error.setAttribute('role','alert');
  const actions=el(container,'div','bg-form-actions');
  const cancel=button(actions,'取消','bg-btn bg-quiet',close);
  const save=button(actions,label,'bg-btn bg-primary',async()=>{
    save.disabled=true;cancel.disabled=true;error.textContent='';
    try { await submit();close(); } catch(e) {error.textContent=e.message||'保存失败，请稍后重试。';}
    finally {save.disabled=false;cancel.disabled=false;}
  });
  container.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(!save.disabled)save.click();}});
}
class GardenScreen {
  constructor(root,host) {
    this.root=root;this.host=host;this.path=null;this.rows=[];this.archive=false;this.edit=false;this.busy=false;this.ticket=0;this.closed=false;this.celebrating=false;
    this.quickDrafts=new Map();this.quickErrors=new Map();this.drafts=new Map();this.saving=new Map();this.composing=false;this.pointerDown=false;
    this.effects=new BingoCelebration(root);
    this.onPointerDown=()=>{this.pointerDown=true;};
    // A blur can save before the following click. Keep its target mounted until click dispatch finishes.
    this.onPointerUp=()=>{clearTimeout(this.pointerTimer);this.pointerTimer=setTimeout(()=>{this.pointerDown=false;if(this.renderPending&&!this.closed){this.renderPending=false;this.render();}},0);};
    root.addEventListener('pointerdown',this.onPointerDown);
    root.ownerDocument.addEventListener('pointerup',this.onPointerUp);
    root.ownerDocument.addEventListener('pointercancel',this.onPointerUp);
  }
  destroy(){this.closed=true;this.ticket++;if(this.timer)clearTimeout(this.timer);this.effects.destroy();clearTimeout(this.pointerTimer);this.root.removeEventListener('pointerdown',this.onPointerDown);this.root.ownerDocument.removeEventListener('pointerup',this.onPointerUp);this.root.ownerDocument.removeEventListener('pointercancel',this.onPointerUp);this.root.replaceChildren();}
  async refresh(){
    const ticket=++this.ticket;
    try {
      const rows=await this.host.store.list();
      if(this.closed||ticket!==this.ticket)return;
      this.rows=rows;
      const visible=rows.filter(r=>r.board && r.board.archived===this.archive);
      if(!visible.some(r=>r.path===this.path)) this.path=visible[0]?.path||null;
      this.render();
    }catch(e){this.host.notice(e.message);}
  }
  current(){return this.rows.find(r=>r.path===this.path);}
  async perform(action,celebrate=false){
    if(this.busy)return;
    this.busy=true;this.root.setAttribute('aria-busy','true');
    const before=this.current()?.board;
    const oldIds=new Set(before ? M.lines(before).map(l=>l.id):[]);
    try {
      const result=await action();
      if(result?.path){this.path=result.path;this.archive=result.board.archived;}
      await this.refresh();
      if(celebrate&&result?.board){
        const fresh=M.lines(result.board).filter(l=>!oldIds.has(l.id));
        if(fresh.length)this.celebrate(result.board,fresh);
      }
    }catch(e){this.host.notice(e.message||'操作失败，请重试。');await this.refresh();}
    finally {this.busy=false;this.root.removeAttribute('aria-busy');}
  }
  celebrate(board,newLines){
    if(this.closed||this.current()?.board.id!==board.id)return;
    this.celebrating=true;
    this.celebrationBoard=board.id;
    this.celebrationLines=newLines;
    this.celebrationText=`✦ BINGO！${newLines.map(l=>l.label).join('、')}已点亮${board.reward ? ' · '+board.reward:''}`;
    const banner=this.root.querySelector('.bg-celebration');
    if(banner){banner.hidden=false;banner.textContent=this.celebrationText;}
    if(!this.edit)this.effects.start(board,newLines);
    this.host.notice(`BINGO！完成 ${newLines.length} 条新连线 🎉`);
    if(this.timer)clearTimeout(this.timer);
    this.timer=setTimeout(()=>{this.celebrating=false;const current=this.root.querySelector('.bg-celebration');if(current)current.hidden=true;},6500);
  }
  render(){
    if(this.closed)return;
    if(this.composing||this.pointerDown){this.renderPending=true;return;}
    const doc=this.root.ownerDocument;
    const focus=doc.activeElement?.getAttribute('data-focus-key');
    const selection=focus&&typeof doc.activeElement.selectionStart==='number'?[doc.activeElement.selectionStart,doc.activeElement.selectionEnd]:null;
    const scroll=this.root.scrollTop;
    this.effects.detach();this.root.replaceChildren();
    this.root.classList.add('bg-root');
    const row=this.current(),board=row?.board;
    if(this.celebrating&&(!board||board.id!==this.celebrationBoard||board.archived||
      !this.celebrationLines.every(line=>line.indexes.every(i=>board.cells[i]?.done&&board.cells[i].title.trim())))){
      this.celebrating=false;clearTimeout(this.timer);
    }
    this.root.dataset.theme=board?.theme||'peach';
    const frame=el(this.root,'div','bg-frame');
    const mast=el(frame,'header','bg-masthead');
    const brand=el(mast,'div','bg-brand');el(brand,'span','bg-brand-mark','✿');
    const brandText=el(brand,'div','bg-brand-text');el(brandText,'span','bg-brand-name','Bingo Garden-Tasks list');el(brandText,'span','bg-brand-caption','让小小的完成，连成好日子');
    const topActions=el(mast,'div','bg-top-actions');
    button(topActions,this.archive?'返回棋盘':'已归档','bg-btn bg-quiet',()=>{this.archive=!this.archive;this.path=null;this.refresh();});
    button(topActions,'＋ 新棋盘','bg-btn bg-primary',()=>this.boardDialog());
    const boards=el(frame,'nav','bg-board-tabs');boards.setAttribute('aria-label',this.archive?'已归档棋盘':'我的棋盘');
    const visible=this.rows.filter(r=>r.board&&r.board.archived===this.archive);
    for(const r of visible){
      const s=M.stats(r.board);
      const b=button(boards,`${r.board.title}  ${s.done}/${s.filled}`,'bg-board-tab'+(r.path===this.path?' is-active':''),()=>{this.path=r.path;this.edit=false;this.render();});
      b.setAttribute('aria-current',String(r.path===this.path));b.title=r.board.title;
    }
    const errors=this.rows.filter(r=>r.error);
    if(errors.length){
      const warning=el(frame,'div','bg-warning');warning.setAttribute('role','alert');
      el(warning,'p','',`${errors.length} 个棋盘未能读取，已保留原文件。请先处理同步冲突或恢复备份。`);
      for(const r of errors)button(warning,r.path,'bg-link',()=>this.host.openFile(r.path));
    }
    if(!board){
      const empty=el(frame,'section','bg-empty');
      el(empty,'div','bg-empty-art','✦');el(empty,'h1','',this.archive?'还没有归档棋盘':'从一个小格子开始');
      el(empty,'p','',this.archive?'完成一轮后，可以把棋盘归档，留下你的进展。':'装下一点工作、一点生活，再给自己一点奖励。');
      if(!this.archive){
        button(empty,'创建我的第一张棋盘','bg-btn bg-primary',()=>this.boardDialog());
        button(empty,'看看示例棋盘','bg-btn bg-quiet',()=>this.demo());
      }
      this.effects.stop();this.footer(frame);return;
    }
    const s=M.stats(board);
    const hero=el(frame,'section','bg-hero');
    const intro=el(hero,'div','bg-intro');
    el(intro,'div','bg-eyebrow',this.archive?'THE LITTLE WINS · 已归档':'THE LITTLE WINS · 我的小小进展');
    el(intro,'h1','bg-title',board.title);
    el(intro,'p','bg-subtitle',this.archive?'这一张，记录了你走过的小步。':'不用一口气完成所有事。点亮一格，就向前一点。');
    const reward=el(intro,'div','bg-reward');el(reward,'span','bg-reward-icon','🎁');
    const rewardText=el(reward,'div');el(rewardText,'span','bg-reward-label','给自己的连线奖励');
    el(rewardText,'strong','',board.reward||'一杯喜欢的饮料，或一段安心休息的时间');
    const progress=el(hero,'div','bg-progress-card');
    const numbers=el(progress,'div','bg-progress-numbers');el(numbers,'strong','',String(s.done));el(numbers,'span','',`/ ${s.filled} 项`);
    el(progress,'div','bg-progress-copy',s.full?'整张点亮，做得很好！':s.filled?'每一个小小完成，都算数':'先放进几件想做的小事');
    const track=el(progress,'div','bg-progress-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label','已填写事项的完成比例');track.setAttribute('aria-valuenow',String(s.percent));track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
    const fill=el(track,'div','bg-progress-fill');fill.style.width=s.percent+'%';
    el(progress,'div','bg-progress-foot',`${s.percent}% 完成　·　${s.wins.length} 条 Bingo`);
    const tools=el(frame,'div','bg-toolbar');
    const meta=el(tools,'div','bg-board-meta');el(meta,'span','bg-size-pill',`${board.size} × ${board.size}`);
    el(meta,'span','bg-help',this.edit?'直接改名称 · Enter / Tab 保存并跳到下一格':'点事项完成 · 点空格添加');
    const actions=el(tools,'div','bg-tools-actions');
    if(!board.archived){
      const toggle=button(actions,this.edit?'✓ 完成编辑':'编辑格子','bg-btn bg-secondary',async()=>{
        if(this.edit){for(const c of board.cells)await this.saveInline(row,c);if(board.cells.some(c=>this.drafts.has(c.id)))return;}
        this.edit=!this.edit;this.render();
      });toggle.setAttribute('aria-pressed',String(this.edit));
      button(actions,'批量添加','bg-btn bg-secondary',()=>this.bulkDialog(row));
    }
    const more=el(actions,'details','bg-more');el(more,'summary','bg-btn bg-secondary','更多 ⋯');
    const menu=el(more,'div','bg-menu');
    const menuButton=(label,fn)=>button(menu,label,'bg-menu-item',()=>{more.open=false;fn();});
    if(!board.archived)menuButton('棋盘设置',()=>this.boardDialog(row));
    menuButton('复制为新一轮',()=>this.perform(async()=>this.host.store.create(M.duplicate(await this.host.store.read(row.path)))));
    if(!board.archived){
      const shuffle=menuButton('打乱格子',()=>this.perform(()=>this.host.store.update(row.path,b=>{if(b.archived)throw new Error('棋盘已归档。');M.shuffle(b);})));
      shuffle.disabled=s.done>0;shuffle.title=s.done>0?'保留已有连线；复制为新一轮后可以打乱':'';
    }
    menuButton(board.archived?'恢复棋盘':'归档棋盘',()=>this.perform(()=>this.host.store.update(row.path,b=>{b.archived=!board.archived;})));
    menuButton('打开棋盘文件',()=>this.host.openFile(row.path));
    if(!board.archived)this.quickEntry(frame,row);
    const celebration=el(frame,'div','bg-celebration',this.celebrationBoard===board.id?this.celebrationText||'':'');celebration.setAttribute('role','status');celebration.setAttribute('aria-live','polite');celebration.hidden=!(this.celebrating&&this.celebrationBoard===board.id);
    const area=el(frame,'section','bg-board-area');
    const grid=el(area,'div','bg-grid');grid.dataset.boardId=board.id;grid.style.setProperty('--bg-cols',board.size);grid.setAttribute('role','group');grid.setAttribute('aria-label',board.title+' Bingo 棋盘');
    const winning=new Set(s.wins.flatMap(l=>l.indexes));
    board.cells.forEach((c,i)=>{
      if(this.edit&&!board.archived){this.cellEditor(grid,row,c,i,winning.has(i));return;}
      const blank=!c.title.trim();
      const b=button(grid,'',`bg-cell${c.done?' is-done':''}${blank?' is-empty':''}${winning.has(i)?' bg-winning':''}`,()=>{
        if(this.busy||board.archived)return;
        if(blank||this.edit){this.cellDialog(row,c,i);return;}
        this.perform(()=>this.host.store.update(row.path,b=>{if(b.archived)throw new Error('棋盘已归档。');M.updateCell(b,c.id,{done:!c.done},c);}),true);
      });
      b.setAttribute('data-focus-key',c.id);b.setAttribute('aria-label',`${i+1}号格：${blank?'添加事项':c.title}，${c.done?'已完成':'未完成'}${this.edit?'，点击编辑':''}`);
      b.setAttribute('aria-pressed',String(c.done));b.disabled=board.archived;
      b.title=blank?'添加事项':`${c.title}${c.note?'\n'+c.note:''}\n${this.edit?'点击编辑':'点击完成 / 撤销；编辑模式可修改内容'}`;
      el(b,'span','bg-cell-number',String(i+1).padStart(2,'0'));
      el(b,'span','bg-cell-emoji',blank?'+':c.emoji);
      el(b,'span','bg-cell-title',blank?'放一件小事':c.title);
      if(c.note&&!blank)el(b,'span','bg-note-dot','· · ·');
      if(c.done)el(b,'span','bg-cell-check','✓');
      b.addEventListener('contextmenu',e=>{if(!board.archived){e.preventDefault();this.cellDialog(row,c,i);}});
    });
    const bottom=el(area,'div','bg-board-bottom');el(bottom,'span','',`✦ 横、竖、对角线，任意连成 ${board.size} 格即可 Bingo`);
    el(bottom,'span','',`${s.total-s.filled} 个空格`);
    if(s.wins.length){
      const wins=el(frame,'div','bg-wins');el(wins,'span','bg-wins-title','收集到的连线');
      for(const l of s.wins)el(wins,'span','bg-win-badge','✦ '+l.label);
    }
    this.footer(frame);
    this.effects.render(this.edit?null:board);
    this.root.scrollTop=scroll;
    if(focus){const target=this.focusKey(focus);if(target&&selection)target.setSelectionRange(...selection);}
  }
  focusKey(key,selectAll=false){
    const target=Array.from(this.root.querySelectorAll('[data-focus-key]')).find(b=>b.getAttribute('data-focus-key')===key);
    target?.focus({preventScroll:true});if(selectAll)target?.select?.();return target;
  }
  trackComposition(input){
    input.addEventListener('compositionstart',()=>{this.composing=true;});
    input.addEventListener('compositionend',()=>{this.composing=false;queueMicrotask(()=>{if(this.renderPending&&!this.closed){this.renderPending=false;this.render();}});});
  }
  quickEntry(frame,row){
    const available=row.board.cells.filter(c=>!c.title.trim()&&!c.note.trim()).length;
    const wrap=el(frame,'section','bg-quick');wrap.setAttribute('aria-label','快速添加事项');
    const line=el(wrap,'div','bg-quick-line');
    const input=el(line,'textarea','bg-quick-input');input.rows=1;
    input.setAttribute('aria-label','快速输入待办');input.setAttribute('data-focus-key','quick:'+row.path);
    input.placeholder=available?'输入一件小事，按 Enter 添加；也可粘贴多行':'棋盘已满，可在「更多 → 棋盘设置」扩大尺寸';
    input.value=this.quickDrafts.get(row.path)||'';input.readOnly=!!this.quickSaving;
    const submit=button(line,this.quickSaving?'添加中…':'＋ 添加','bg-btn bg-primary',()=>this.addQuick(row));
    const sync=()=>{this.quickDrafts.set(row.path,input.value);submit.disabled=!available||!input.value.trim()||!!this.quickSaving;input.style.height='auto';input.style.height=Math.min(140,Math.max(44,input.scrollHeight))+'px';};
    input.addEventListener('input',sync);this.trackComposition(input);sync();
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();this.addQuick(row);}});
    const hint=el(wrap,'div','bg-quick-hint',available?`Enter 添加 · Shift + Enter 换行 · 每行一项，填入空格 · 剩余 ${available} 格`:'这张棋盘已满。编辑格子可直接修改名称，也可以新建一张棋盘。');
    hint.id='bg-quick-hint-'+row.board.id;input.setAttribute('aria-describedby',hint.id);
    const error=el(wrap,'div','bg-form-error',this.quickErrors.get(row.path)||'');error.setAttribute('role','alert');
  }
  async addQuick(row){
    const text=this.quickDrafts.get(row.path)||'';
    if(this.busy||this.quickSaving||!text.trim())return;
    this.quickSaving=true;this.quickErrors.delete(row.path);this.render();
    try {
      await this.host.store.update(row.path,b=>{if(b.archived)throw new Error('棋盘已归档。');M.fillEmpty(b,text);});
      if(this.quickDrafts.get(row.path)===text)this.quickDrafts.delete(row.path);
    }catch(e){this.quickErrors.set(row.path,e.message||'添加失败，输入内容已保留。');}
    finally {this.quickSaving=false;await this.refresh();if(this.path===row.path)this.focusKey('quick:'+row.path);}
  }
  cellEditor(grid,row,c,index,winning){
    const card=el(grid,'div',`bg-cell bg-cell-editor${c.done?' is-done':''}${winning?' bg-winning':''}`);
    el(card,'span','bg-cell-number',String(index+1).padStart(2,'0'));
    el(card,'span','bg-cell-emoji',c.emoji);
    const input=el(card,'textarea','bg-inline-input');input.rows=2;input.maxLength=160;
    input.setAttribute('aria-label',`${index+1}号格事项名称`);input.setAttribute('data-focus-key','edit:'+c.id);
    input.value=this.drafts.get(c.id)?.value??c.title;input.placeholder='写一件小事';input.readOnly=this.saving.has(c.id);
    const status=el(card,'span','bg-inline-status');status.setAttribute('aria-live','polite');
    const draft=this.drafts.get(c.id);
    status.textContent=draft?.error?'未保存 · Esc 恢复最新内容':this.saving.has(c.id)?'保存中…':draft?'待保存':'Enter 保存并下一格';
    if(draft?.error){status.classList.add('bg-form-error');status.title=draft.error;card.title=draft.error;}
    input.addEventListener('input',()=>{const existing=this.drafts.get(c.id);this.drafts.set(c.id,{value:input.value,expected:existing?.expected||structuredClone(c)});status.textContent='待保存';status.classList.remove('bg-form-error');});
    this.trackComposition(input);
    input.addEventListener('change',()=>{if(!this.composing)this.saveInline(row,c);});
    input.addEventListener('keydown',e=>{
      if(e.isComposing||e.keyCode===229||this.saving.has(c.id))return;
      if(e.key==='Enter'||e.key==='Tab'){
        const offset=e.shiftKey?-1:1;
        if(e.key==='Tab'&&(index+offset<0||index+offset>=row.board.cells.length))return;
        e.preventDefault();
        const next=row.board.cells[(index+offset+row.board.cells.length)%row.board.cells.length];
        this.saveInline(row,c,next.id);
      }else if(e.key==='Escape'){
        e.preventDefault();e.stopPropagation();this.drafts.delete(c.id);this.render();
      }
    });
    button(card,'详情','bg-cell-details',async()=>{await this.saveInline(row,c);if(this.drafts.has(c.id))return;const latest=this.rows.find(r=>r.path===row.path);const cell=latest?.board?.cells.find(x=>x.id===c.id);if(cell&&!latest.board.archived)this.cellDialog(latest,cell,index);}).setAttribute('aria-label',`${index+1}号格详情`);
  }
  async saveInline(row,c,nextId){
    if(this.saving.has(c.id)){await this.saving.get(c.id);return;}
    const draft=this.drafts.get(c.id);
    if(!draft||draft.value===draft.expected.title){this.drafts.delete(c.id);if(nextId)this.focusKey('edit:'+nextId,true);return;}
    const save=(async()=>{
      try {
        await this.host.store.update(row.path,b=>{if(b.archived)throw new Error('棋盘已归档。');M.updateCell(b,c.id,{title:draft.value},draft.expected);});
        if(this.drafts.get(c.id)===draft)this.drafts.delete(c.id);
      }catch(e){draft.error=e.message||'保存失败。';this.host.notice(draft.error+' 输入内容已保留；按 Esc 可恢复最新内容。');}
      finally {this.saving.delete(c.id);await this.refresh();}
      if(nextId&&!this.drafts.has(c.id)&&this.path===row.path&&this.root.ownerDocument.activeElement?.getAttribute('data-focus-key')==='edit:'+c.id)this.focusKey('edit:'+nextId,true);
    })();
    this.saving.set(c.id,save);const active=Array.from(this.root.querySelectorAll('[data-focus-key]')).find(x=>x.getAttribute('data-focus-key')==='edit:'+c.id);if(active)active.readOnly=true;
    await save;
  }
  footer(frame){
    const footer=el(frame,'footer','bg-footer');el(footer,'span','','🌱 数据保存在笔记库 · 同步由你的同步工具完成');
    el(footer,'span','','BINGO GARDEN');
  }
  boardDialog(row){
    const current=row?.board;
    this.host.dialog(current?'棋盘设置':'种下一张新棋盘',(root,close)=>{
      el(root,'p','bg-dialog-intro',current?'换个名字、配色，或者给自己安排一个小奖励。':'大目标也可以轻轻开始。选一个刚刚好的尺寸。');
      const title=field(root,'棋盘名称',current?.title||'');title.placeholder='例如：这周的小小进展';title.maxLength=80;
      const size=select(root,'棋盘尺寸',current?.size||5,M.SIZES.map(n=>[String(n),`${n} × ${n} · ${n*n} 格`]));
      if(current)el(root,'p','bg-field-hint','修改尺寸会依次重新排列已有事项，并重新计算连线；已有完成记录保留。');
      const reward=field(root,'连成一线，奖励自己',current?.reward||'');reward.placeholder='例如：去喝一杯喜欢的咖啡';reward.maxLength=160;
      el(root,'div','bg-field-label','棋盘配色');const getTheme=themePicker(root,current?.theme||'peach');
      formActions(root,close,async()=>{
        if(!title.value.trim())throw new Error('给棋盘取一个名字吧。');
        let result;
        if(current){
          result=await this.host.store.update(row.path,b=>{
            if(b.archived)throw new Error('棋盘已归档，请先恢复。');
            for(const key of ['title','size','reward','theme'])if(b[key]!==current[key])throw new Error('棋盘设置已在别处更新，请重新打开设置。');
            M.resize(b,Number(size.value));b.title=title.value.trim();b.reward=reward.value.trim();b.theme=getTheme();
          });
        }else result=await this.host.store.create(M.createBoard({title:title.value,size:Number(size.value),reward:reward.value,theme:getTheme()}));
        this.path=result.path;this.archive=false;this.edit=false;await this.refresh();
      },current?'保存设置':'创建棋盘');
    });
  }
  cellDialog(row,c,index){
    const expected=JSON.parse(JSON.stringify(c));
    this.host.dialog(`${String(index+1).padStart(2,'0')} · ${c.title?'编辑小事':'放进一件小事'}`,(root,close)=>{
      const title=field(root,'要做的小事',c.title);title.placeholder='把事情拆到能轻松开始的大小';title.maxLength=160;
      const emoji=field(root,'格子图标',c.emoji);emoji.maxLength=24;
      const autoWrap=el(root,'label','bg-check-label');const auto=el(autoWrap,'input');auto.type='checkbox';auto.checked=M.iconMode(c)==='auto';el(autoWrap,'span','','按事项内容自动搭配图标');
      const suggest=()=>{if(auto.checked)emoji.value=M.suggestEmoji(title.value,row.board,c.id);};
      title.addEventListener('input',suggest);auto.addEventListener('change',suggest);
      emoji.addEventListener('input',()=>{auto.checked=false;});
      const emojis=el(root,'div','bg-emojis');
      for(const icon of ['🌱','☕','📖','💻','🏃','🧹','💌','🎨','🌙','🍎','🎯','✨'])button(emojis,icon,'bg-emoji-option',()=>{emoji.value=icon;auto.checked=false;});
      const note=field(root,'补充说明（可选）',c.note,'textarea');note.rows=3;note.maxLength=4000;note.placeholder='记录下一步、参考资料，或给自己的鼓励';
      const doneWrap=el(root,'label','bg-check-label');const done=el(doneWrap,'input');done.type='checkbox';done.checked=c.done;el(doneWrap,'span','','这件事已完成');
      el(root,'p','bg-field-hint','清空事项名称并保存可腾出这一格；补充说明和完成状态也会清除。');
      formActions(root,close,async()=>{
        const result=await this.host.store.update(row.path,b=>{
          if(b.archived)throw new Error('棋盘已归档，请先恢复。');
          M.updateCell(b,c.id,{title:title.value,emoji:emoji.value,emojiMode:auto.checked?'auto':'manual',note:note.value,done:done.checked},expected);
        });
        const oldIds=new Set(M.lines(row.board).map(l=>l.id));
        await this.refresh();
        const fresh=M.lines(result.board).filter(l=>!oldIds.has(l.id));if(fresh.length)this.celebrate(result.board,fresh);
      });
    });
  }
  bulkDialog(row){
    const available=row.board.cells.filter(c=>!c.title.trim()&&!c.note.trim()).length;
    this.host.dialog('把小事装进棋盘',(root,close)=>{
      el(root,'p','bg-dialog-intro',`每行一件小事，会依次放入空格。当前还有 ${available} 个可用空格。`);
      const input=field(root,'事项内容','','textarea');input.rows=9;input.placeholder='整理今天的资料\n散步 20 分钟\n给朋友发条消息';
      formActions(root,close,async()=>{
        await this.host.store.update(row.path,b=>{if(b.archived)throw new Error('棋盘已归档。');M.fillEmpty(b,input.value);});await this.refresh();
      },'填入空格');
    });
  }
  demo(){
    return this.perform(async()=>{
      const b=M.createBoard({title:'一周的小小进展 · 示例',size:5,reward:'去喜欢的咖啡店，享受一段放空时间'});
      const titles=['喝一杯温水','整理桌面','散步 20 分钟','读 10 页书','早点休息','写下今日重点','处理一封邮件','吃一份水果','推进一个小项目','听一首喜欢的歌','伸展 5 分钟','清理下载文件夹','给朋友发消息','做一顿简单的饭','记录一个灵感','整理本周资料','学一个小知识','给植物浇水','完成一次复盘','留 15 分钟发呆','出门晒晒太阳','收拾一个抽屉','写三件开心的事','规划明天','奖励一下自己'];
      const icons=['💧','🧹','🏃','📖','🌙','🎯','💌','🍎','💻','🎵','🌿','📂','💬','🍳','💡','📚','🧠','🌱','✍️','☁️','☀️','🗃️','✨','🗓️','☕'];
      b.cells.forEach((c,i)=>{c.title=titles[i];c.emoji=icons[i];});
      return this.host.store.create(b);
    });
  }
}
module.exports={GardenScreen,el,button};
