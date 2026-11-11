const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const qa=path.resolve(__dirname,'../../qa');fs.mkdirSync(qa,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1080,height:1200}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../preview.html')).href);
    await page.evaluate(()=>localStorage.clear());await page.reload();
    const prepare=async(size,done)=>{await page.evaluate(async({size,done})=>{
      const s=window.screenApp,m=window.model;
      const b=m.createBoard({title:'连线动画 · 示例',size,reward:'一杯喜欢的咖啡'});
      b.cells.forEach((c,i)=>{m.updateCell(b,c.id,{title:['读几页书','伸展一下','喝杯温水','整理桌面','散步片刻','记录灵感'][i%6]});if(done.includes(i))m.updateCell(b,c.id,{done:true});});
      const row=await s.host.store.create(b);s.path=row.path;s.archive=false;s.edit=false;await s.refresh();
    },{size,done});
      await page.waitForFunction(()=>!window.screenApp.pointerDown&&document.querySelector('.bg-grid')?.dataset.boardId===window.screenApp.current().board.id);
    };
    const click=async i=>{
      const before=await page.locator('.bg-cell').nth(i).getAttribute('aria-pressed');
      await page.locator('.bg-cell').nth(i).click();
      await page.waitForFunction(({i,before})=>!window.screenApp.busy&&!window.screenApp.pointerDown&&document.querySelectorAll('.bg-cell')[i]?.getAttribute('aria-pressed')!==before,{i,before});
    };
    const effect=()=>page.locator('.bg-bingo-effects');
    await prepare(3,[0,1]);await click(2);
    assert.equal(await effect().count(),1);assert.equal(await page.locator('.bg-line-pop').count(),3);
    assert.equal(await page.locator('.bg-bingo-stroke').count(),1);
    assert.equal(await effect().evaluate(e=>getComputedStyle(e).pointerEvents),'none');
    // Vault modify events refresh the view shortly after saving: continue the same animation.
    const started=await page.evaluate(()=>window.screenApp.effects.state.startedAt);
    await page.waitForTimeout(200);await page.evaluate(()=>window.screenApp.refresh());
    assert.equal(await page.evaluate(()=>window.screenApp.effects.state.startedAt),started);
    assert.ok(await page.locator('.bg-bingo-stroke').evaluate(e=>parseFloat(e.style.animationDelay)<0));
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(qa,'bingo-celebration.png'),fullPage:true});
    // Undo must remain clickable through the animation and immediately clear stale celebration.
    await click(2);assert.equal(await effect().count(),0);assert.equal(await page.locator('.bg-celebration').isVisible(),false);
    await click(2);await page.reload();await page.locator('.bg-winning').first().waitFor();
    assert.equal(await effect().count(),0);assert.equal(await page.locator('.is-done').count(),3);
    // A second row only pulses its own cells, not an already completed row.
    await prepare(3,[0,1,2,3,4]);await click(5);assert.equal(await page.locator('.bg-winning').count(),6);assert.equal(await page.locator('.bg-line-pop').count(),3);
    await effect().waitFor({state:'detached',timeout:4000});
    assert.equal(await page.locator('.bg-line-pop').count(),0);assert.equal(await page.evaluate(()=>window.screenApp.effects.observer),null);
    // Completing the center can finish a row, column, and both diagonals in a single click.
    await prepare(3,[0,1,2,3,5,6,7,8]);await click(4);
    assert.equal(await page.locator('.bg-bingo-stroke').count(),4);assert.equal(await page.locator('.bg-line-pop').count(),9);
    assert.match(await page.locator('.bg-bingo-toast').innerText(),/4 条连线/);
    // A preference change must also stop effects already mounted, via the CSS cascade.
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await effect().evaluate(e=>getComputedStyle(e).display),'none');
    assert.ok(await page.locator('.bg-line-pop,.bg-bingo-line,.bg-bingo-toast,.bg-bingo-confetti').evaluateAll(nodes=>nodes.every(e=>getComputedStyle(e).animationName==='none')));
    assert.ok(await page.locator('.bg-btn,.bg-cell,.bg-progress-fill').evaluateAll(nodes=>nodes.every(e=>getComputedStyle(e).transitionDuration==='0s')));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'编辑内容',exact:true}).click();await effect().waitFor({state:'detached',timeout:500});
    await page.getByRole('button',{name:'✓ 完成编辑',exact:true}).click();assert.equal(await effect().count(),0);
    // A restored/completed board and board switching do not replay animations.
    await prepare(3,[0,1]);await click(2);
    const activeIndex=await page.locator('.bg-board-tab').evaluateAll(tabs=>tabs.findIndex(t=>t.classList.contains('is-active')));
    await page.locator('.bg-board-tab:not(.is-active)').first().click();await effect().waitFor({state:'detached',timeout:500});
    await page.locator('.bg-board-tab').nth(activeIndex).click();assert.equal(await effect().count(),0);
    await page.emulateMedia({reducedMotion:'reduce'});await prepare(3,[0,1]);await click(2);
    assert.equal(await effect().count(),0);assert.equal(await page.locator('.bg-celebration').isVisible(),true);
    await page.emulateMedia({reducedMotion:'no-preference'});
    // Coordinate geometry follows responsive rectangular cells, including narrow 6-column boards.
    for(const size of [3,4,5,6]){
      await page.setViewportSize({width:320,height:1000});
      await prepare(size,Array.from({length:size-1},(_,i)=>i*size));await click((size-1)*size);
      assert.equal(await page.locator('.bg-bingo-stroke').count(),1);
      const geometry=await page.locator('.bg-bingo-stroke').evaluate(e=>({x1:+e.getAttribute('x1'),x2:+e.getAttribute('x2'),y1:+e.getAttribute('y1'),y2:+e.getAttribute('y2')}));
      assert.ok(Math.abs(geometry.x1-geometry.x2)<1);assert.ok(geometry.y2>geometry.y1);
      await page.setViewportSize({width:390,height:1000});
      await page.waitForFunction(()=>Math.abs(+document.querySelector('.bg-bingo-trails').getAttribute('viewBox').split(' ')[2]-document.querySelector('.bg-grid').getBoundingClientRect().width)<1);
      assert.equal(await page.evaluate(()=>document.querySelector('#garden').scrollWidth>document.querySelector('#garden').clientWidth+1),false);
    }
    await page.getByRole('button',{name:'切换明暗',exact:true}).click();
    await prepare(3,[0,4]);await click(8);await page.screenshot({path:path.join(qa,'bingo-celebration-mobile-dark.png'),fullPage:true});
    // Closing a screen mid-save or mid-animation must not leave timers or resurrect the view.
    await page.evaluate(()=>{const s=window.screenApp;s.destroy();s.celebrate(s.current().board,window.model.lines(s.current().board));s.render();});
    assert.equal(await page.locator('#garden > *').count(),0);
    assert.equal(await page.evaluate(()=>window.screenApp.effects.timer),null);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(qa,'celebration-results.json'),JSON.stringify({passed:true,checks:['new-row-only','refresh-resumes-timeline','undo-is-clickable','reload-does-not-replay','timer-and-observer-cleanup','four-simultaneous-lines','edit-and-switch-cleanup','reduced-motion','3-to-6-column-mobile-geometry','resize','dark-mode','closed-view-cleanup'],browserErrors:errors},null,2));
    console.log('Celebration UI verification passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
