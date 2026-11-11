const {Plugin,ItemView,Modal,Notice,addIcon}=require('obsidian');
const {BoardStore,FOLDER}=require('./store.js');
const {GardenScreen,el,button}=require('./ui.js');
const {parseBoard}=require('./model.js');
const VIEW='bingo-garden-view';
const ICON='bingo-garden-grid';
class GardenModal extends Modal {
  constructor(app,title,build){super(app);this.title=title;this.build=build;}
  onOpen(){this.modalEl.classList.add('bg-modal');this.titleEl.textContent=this.title;this.build(this.contentEl,()=>this.close());}
  onClose(){this.contentEl.replaceChildren();}
}
class GardenView extends ItemView {
  constructor(leaf,plugin){super(leaf);this.plugin=plugin;}
  getViewType(){return VIEW;}
  getDisplayText(){return this.plugin.manifest.name;}
  getIcon(){return ICON;}
  async onOpen(){
    this.screen=new GardenScreen(this.contentEl,{
      store:this.plugin.store,
      notice:message=>new Notice(message,6000),
      dialog:(title,build)=>new GardenModal(this.app,title,build).open(),
      openFile:async path=>{const f=this.app.vault.getAbstractFileByPath(path);if(f)await this.app.workspace.getLeaf('tab').openFile(f);}
    });
    this.plugin.screens.add(this.screen);
    await this.screen.refresh();
  }
  async onClose(){if(this.screen){this.plugin.screens.delete(this.screen);this.screen.destroy();}}
  getState(){return {path:this.screen?.path,archive:this.screen?.archive||false};}
  async setState(state,result){
    if(this.screen){this.screen.path=state.path||null;this.screen.archive=!!state.archive;await this.screen.refresh();}
    await super.setState(state,result);
  }
}
class BingoGardenPlugin extends Plugin {
  async onload(){
    addIcon(ICON,'<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="88" height="88" rx="10"/><path d="M35 6v88M65 6v88M6 35h88M6 65h88"/></g>');
    this.screens=new Set();this.store=new BoardStore(this.app.vault);
    this.registerView(VIEW,leaf=>new GardenView(leaf,this));
    this.addRibbonIcon(ICON,'打开 '+this.manifest.name,()=>this.open());
    this.addCommand({id:'open',name:'打开棋盘',callback:()=>this.open()});
    this.addCommand({id:'new-board',name:'新建棋盘',callback:async()=>{const view=await this.open();view.screen.boardDialog();}});
    const refresh=file=>{
      if(file&&!this.store.isBoardPath(file.path))return;
      if(this.refreshTimer)clearTimeout(this.refreshTimer);
      this.refreshTimer=setTimeout(()=>{for(const screen of this.screens)screen.refresh();},180);
    };
    for(const event of ['create','modify','delete'])this.registerEvent(this.app.vault.on(event,refresh));
    this.registerEvent(this.app.vault.on('rename',(file,oldPath)=>{if(this.store.isBoardPath(file.path)||this.store.isBoardPath(oldPath))refresh();}));
    this.registerMarkdownCodeBlockProcessor('bingo-garden-data',(source,container,ctx)=>{
      try {
        const b=parseBoard('```bingo-garden-data\n'+source+'\n```');
        const card=el(container,'div','bg-file-card');el(card,'strong','','✦ '+b.title);
        el(card,'span','',`${b.size} × ${b.size} · ${b.cells.filter(c=>c.done).length} 项已完成`);
        button(card,'打开棋盘','bg-btn bg-primary',async()=>{const view=await this.open();view.screen.path=ctx.sourcePath;view.screen.archive=b.archived;await view.screen.refresh();});
      }catch(e){el(container,'p','bg-form-error',e.message);}
    });
  }
  async open(){
    let leaf=this.app.workspace.getLeavesOfType(VIEW)[0];
    if(!leaf){leaf=this.app.workspace.getLeaf('tab');await leaf.setViewState({type:VIEW,active:true});}
    await this.app.workspace.revealLeaf(leaf);return leaf.view;
  }
  onunload(){if(this.refreshTimer)clearTimeout(this.refreshTimer);for(const s of this.screens||[])s.destroy();this.screens?.clear();}
}
module.exports=BingoGardenPlugin;
