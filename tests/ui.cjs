const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../preview.html')).href);
    await page.evaluate(()=>localStorage.clear());await page.reload();
    await page.getByRole('button',{name:'创建我的第一张棋盘'}).click();
    await page.getByLabel('棋盘名称',{exact:true}).fill('我的测试棋盘');
    await page.getByLabel('棋盘尺寸',{exact:true}).selectOption('3');
    await page.getByLabel('连成一线，奖励自己').fill('喝一杯咖啡');
    await page.getByRole('button',{name:'创建棋盘',exact:true}).click();
    await page.getByRole('heading',{name:'我的测试棋盘'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'棋盘设置',exact:true}).isVisible(),true);
    assert.equal(await page.getByRole('button',{name:'复制新一轮',exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'批量添加',exact:true}).click();
    await page.getByLabel('事项内容',{exact:true}).fill('事项 1\n事项 2\n事项 3\n事项 4\n事项 5\n事项 6\n事项 7\n事项 8\n事项 9');
    await page.getByRole('button',{name:'填入空格',exact:true}).click();
    await page.locator('.bg-cell:not(.is-empty)').first().waitFor();
    for(let i=0;i<3;i++){
      await page.locator('.bg-cell').nth(i).click();
      await page.waitForFunction(n=>document.querySelectorAll('.bg-cell.is-done').length===n,i+1);
    }
    assert.equal(await page.locator('.bg-winning').count(),3);
    assert.match(await page.locator('.bg-celebration').innerText(),/BINGO/);
    const originalCells=await page.evaluate(()=>JSON.stringify(window.screenApp.current().board.cells));
    await page.getByRole('button',{name:'扩大棋盘',exact:true}).click();
    await page.getByLabel('棋盘尺寸',{exact:true}).selectOption('4');
    await page.getByRole('button',{name:'保存设置',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.bg-cell').length===16);
    assert.equal(await page.evaluate(()=>JSON.stringify(window.screenApp.current().board.cells.slice(0,9))),originalCells);
    await page.getByRole('button',{name:'棋盘设置',exact:true}).click();
    await page.getByLabel('棋盘尺寸',{exact:true}).selectOption('3');
    await page.getByRole('button',{name:'保存设置',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.bg-cell').length===9);
    await page.reload();await page.locator('.bg-winning').first().waitFor();assert.equal(await page.locator('.is-done').count(),3);
    await page.locator('.bg-cell').first().click();await page.waitForFunction(()=>document.querySelectorAll('.bg-winning').length===0);
    await page.getByRole('button',{name:'编辑内容',exact:true}).click();
    await page.getByRole('button',{name:'2号格图标和备注',exact:true}).click();
    await page.getByLabel('要做的小事',{exact:true}).fill('跨端修改应被保留');
    await page.evaluate(async()=>{const s=window.screenApp;const row=s.current();await s.host.store.update(row.path,b=>window.model.updateCell(b,b.cells[1].id,{title:'另一端的新内容'}));});
    await page.getByRole('button',{name:'保存',exact:true}).click();await page.getByRole('alert').filter({hasText:'已在别处更新'}).waitFor();
    await page.getByRole('button',{name:'取消',exact:true}).click();await page.evaluate(()=>window.screenApp.refresh());
    assert.equal(await page.getByLabel('2号格事项名称',{exact:true}).inputValue(),'另一端的新内容');
    await page.getByRole('button',{name:'✓ 完成编辑',exact:true}).click();
    const originalBoard=await page.evaluate(()=>({path:window.screenApp.path,board:JSON.stringify(window.screenApp.current().board)}));
    await page.getByRole('button',{name:'复制新一轮',exact:true}).click();
    await page.getByRole('heading',{name:'我的测试棋盘 · 新一轮'}).waitFor();assert.equal(await page.locator('.is-done').count(),0);
    assert.equal(await page.evaluate(p=>JSON.stringify(window.screenApp.rows.find(r=>r.path===p).board),originalBoard.path),originalBoard.board);
    assert.equal(await page.locator('.bg-board-tab').count(),2);
    await page.locator('summary').click();await page.getByRole('button',{name:'归档棋盘',exact:true}).click();
    await page.getByRole('button',{name:'返回我的棋盘',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'恢复到我的棋盘',exact:true}).isVisible(),true);
    assert.equal(await page.locator('.bg-cell:disabled').count(),9);
    await page.getByRole('button',{name:'恢复到我的棋盘',exact:true}).click();
    await page.getByRole('button',{name:'归档箱 (0)',exact:true}).waitFor();assert.equal(await page.locator('.bg-cell:disabled').count(),0);
    await page.waitForFunction(()=>!window.screenApp.busy);
    // Copying from edit mode must include the title being saved by blur, even on a slow disk.
    await page.getByRole('button',{name:'编辑内容',exact:true}).click();
    await page.getByLabel('1号格事项名称',{exact:true}).fill('新一轮的最新待办');
    await page.evaluate(()=>{const v=window.screenApp.host.store.vault,original=v.process;v.process=async(...args)=>{v.process=original;await new Promise(r=>setTimeout(r,250));return original(...args)};});
    await page.getByRole('button',{name:'复制新一轮',exact:true}).click();
    await page.getByRole('heading',{name:'我的测试棋盘 · 新一轮 · 新一轮',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.screenApp.current().board.cells[0].title),'新一轮的最新待办');
    assert.equal(await page.locator('.bg-inline-input').count(),0);
    // Prepare an explicitly labelled example for visual checks; it is not user data.
    await page.evaluate(async()=>{const s=window.screenApp;await s.demo();const row=s.current();await s.host.store.update(row.path,b=>{[0,1,2,3,4,6,10,12,17].forEach(i=>window.model.updateCell(b,b.cells[i].id,{done:true}));});await s.refresh();});
    await page.evaluate(async()=>{const s=window.screenApp;const data=window.previewData();for(const key of Object.keys(data)){if(key.endsWith('.md')&&key!==s.path)delete data[key];}await s.refresh();});
    await page.waitForFunction(()=>document.querySelector('#notices').children.length===0);
    const qa=path.resolve(__dirname,'../../qa');fs.mkdirSync(qa,{recursive:true});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width:1080,height:1450});
    await page.screenshot({path:path.join(qa,'desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:1000});await page.screenshot({path:path.join(qa,'mobile.png'),fullPage:true});
    for(const width of [320,390,768,1200]){
      await page.setViewportSize({width,height:1000});
      const overflow=await page.evaluate(()=>{const r=document.querySelector('#garden');return r.scrollWidth>r.clientWidth+1;});assert.equal(overflow,false,'horizontal overflow at '+width);
    }
    await page.setViewportSize({width:390,height:1000});await page.getByRole('button',{name:'编辑内容',exact:true}).click();await page.getByRole('button',{name:'2号格图标和备注',exact:true}).click();
    await page.screenshot({path:path.join(qa,'mobile-editor.png'),fullPage:true});await page.getByRole('button',{name:'取消',exact:true}).click();
    await page.getByRole('button',{name:'✓ 完成编辑',exact:true}).click();
    await page.getByRole('button',{name:'切换明暗',exact:true}).click();await page.screenshot({path:path.join(qa,'mobile-dark.png'),fullPage:true});
    // Six columns remain usable at the smallest supported viewport.
    await page.evaluate(async()=>{const s=window.screenApp;const row=s.current();await s.host.store.update(row.path,b=>window.model.resize(b,6));await s.refresh()});
    await page.setViewportSize({width:320,height:1100});await page.screenshot({path:path.join(qa,'mobile-6x6.png'),fullPage:true});
    assert.equal(await page.locator('.bg-cell').count(),36);
    const minWidth=await page.locator('.bg-cell').first().evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(minWidth>=40,'touch target narrower than 40px: '+minWidth);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(qa,'ui-results.json'),JSON.stringify({passed:true,checks:['visible-settings-and-new-round','create','bulk-add','complete','bingo','expand-board-preserves-cells','undo','reload-persistence','same-cell-conflict','copy-round-preserves-original','archive','visible-restore','320/390/768/1200 layout','mobile-editor','dark-mode','6x6'],browserErrors:errors},null,2));
    console.log('UI verification passed: interactions, persistence, conflicts, responsive layouts and dark mode.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
