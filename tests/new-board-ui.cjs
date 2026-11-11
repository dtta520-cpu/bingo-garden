const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:650}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../preview.html')).href);
    await page.evaluate(()=>localStorage.clear());await page.reload();
    await page.getByRole('button',{name:'看看示例棋盘',exact:true}).click();
    await page.getByRole('heading',{name:'一周的小小进展 · 示例',exact:true}).waitFor();
    const original=await page.evaluate(()=>JSON.stringify(window.screenApp.current().board));
    // Read geometry before clicking: Playwright must not scroll a hidden button into view for us.
    for(const width of [320,390,1200]){
      await page.setViewportSize({width,height:650});
      await page.evaluate(()=>{const root=document.querySelector('#garden');root.scrollTop=root.scrollHeight;});
      const reachable=await page.getByRole('button',{name:'＋ 新棋盘',exact:true}).evaluate(e=>{
        const r=e.getBoundingClientRect(),root=e.closest('.bg-root').getBoundingClientRect();
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return r.top>=root.top&&r.bottom<=root.bottom&&e.contains(hit);
      });
      assert.equal(reachable,true,'New board button inaccessible after scrolling at width '+width);
    }
    await page.setViewportSize({width:390,height:650});
    await page.getByRole('button',{name:'＋ 新棋盘',exact:true}).click();
    await page.getByLabel('棋盘名称',{exact:true}).fill('第二张棋盘');
    await page.getByRole('button',{name:'创建棋盘',exact:true}).click();
    await page.getByRole('heading',{name:'第二张棋盘',exact:true}).waitFor();
    assert.equal(await page.locator('.bg-board-tab').count(),2);
    assert.equal(await page.locator('#garden').evaluate(e=>e.scrollTop),0);
    assert.ok(await page.getByRole('heading',{name:'第二张棋盘',exact:true}).evaluate(e=>e.getBoundingClientRect().top>=0));
    await page.getByRole('button',{name:/一周的小小进展 · 示例 0\/25/}).click();
    assert.equal(await page.evaluate(()=>JSON.stringify(window.screenApp.current().board)),original);
    await page.getByRole('button',{name:'新建另一张棋盘',exact:true}).click();
    await page.getByLabel('棋盘名称',{exact:true}).fill('第三张棋盘');
    await page.getByRole('button',{name:'创建棋盘',exact:true}).click();
    await page.getByRole('heading',{name:'第三张棋盘',exact:true}).waitFor();
    await page.reload();await page.getByRole('heading',{name:'第三张棋盘',exact:true}).waitFor();
    assert.equal(await page.locator('.bg-board-tab').count(),3);
    await page.getByRole('button',{name:'＋ 新棋盘',exact:true}).click();
    await page.getByRole('button',{name:'创建棋盘',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'给棋盘取一个名字吧。'}).waitFor();
    await page.getByRole('button',{name:'取消',exact:true}).click();
    assert.equal(await page.locator('.bg-board-tab').count(),3);
    const qa=path.resolve(__dirname,'../../qa');fs.mkdirSync(qa,{recursive:true});
    await page.getByRole('button',{name:/一周的小小进展 · 示例 0\/25/}).click();
    await page.evaluate(()=>{const root=document.querySelector('#garden');root.scrollTop=root.scrollHeight;});
    await page.screenshot({path:path.join(qa,'new-board-scrolled-mobile.png')});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(qa,'new-board-results.json'),JSON.stringify({passed:true,checks:['new-board-accessible-after-scroll-320-390-1200','create-second-board','create-from-full-board','preserve-existing-board','reset-scroll-after-create','reload-persistence','empty-name-validation'],browserErrors:errors},null,2));
    console.log('New-board UI regression checks passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
