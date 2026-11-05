const M = require('./model.js');
const FOLDER = 'Bingo Garden';
class BoardStore {
  constructor(vault) { this.vault = vault; this.pending = Promise.resolve(); }
  isBoardPath(path) { return path.startsWith(FOLDER + '/') && path.endsWith('.md'); }
  async list() {
    const files=this.vault.getMarkdownFiles().filter(f=>this.isBoardPath(f.path));
    const results=await Promise.all(files.map(async file=> {
      const text=await this.vault.read(file);
      if (!text.includes('```bingo-garden-data')) return null;
      try { return {path:file.path,board:M.parseBoard(text)}; }
      catch(e) { return {path:file.path,error:e.message}; }
    }));
    return results.filter(Boolean).sort((a,b)=>(b.board?.createdAt||'').localeCompare(a.board?.createdAt||''));
  }
  async read(path) {
    if (!this.isBoardPath(path)) throw new Error('棋盘路径不在 Bingo Garden 文件夹内。');
    const file=this.vault.getAbstractFileByPath(path);
    if (!file || file.extension !== 'md') throw new Error('棋盘文件已移动或删除，请刷新棋盘。');
    return M.parseBoard(await this.vault.read(file));
  }
  queue(fn) {
    const result=this.pending.then(fn);
    this.pending=result.catch(()=>{});
    return result;
  }
  create(board) {
    return this.queue(async()=>{
      M.validate(board);
      if (!this.vault.getAbstractFileByPath(FOLDER)) await this.vault.createFolder(FOLDER);
      const path=`${FOLDER}/${board.id}.md`;
      await this.vault.create(path,M.serialize(board));
      return {path,board};
    });
  }
  update(path, mutate) {
    return this.queue(async()=>{
      if (!this.isBoardPath(path)) throw new Error('无效的棋盘路径。');
      const file=this.vault.getAbstractFileByPath(path);
      if (!file || file.extension !== 'md') throw new Error('棋盘文件已移动或删除。');
      let saved;
      // Vault.process reads the latest file, then applies only the requested change atomically.
      await this.vault.process(file,text=>{
        const board=M.parseBoard(text);
        mutate(board);
        board.updatedAt=M.now();
        saved=M.validate(board);
        return M.serialize(saved,text);
      });
      return {path,board:saved};
    });
  }
}
module.exports={BoardStore,FOLDER};
