// Visual state stays separate from saved board data. Refreshes resume the same timeline.
const DURATION=2300;
class BingoCelebration {
  constructor(root){this.root=root;this.state=null;this.observer=null;this.timer=null;}
  detach(){
    this.observer?.disconnect();this.observer=null;
    this.root.querySelectorAll('.bg-bingo-effects').forEach(node=>node.remove());
    this.root.querySelectorAll('.bg-line-pop').forEach(node=>{node.classList.remove('bg-line-pop');node.style.removeProperty('--bg-pop-delay');});
  }
  stop(){clearTimeout(this.timer);this.timer=null;this.state=null;this.detach();}
  start(board,lines){
    this.stop();
    if(this.root.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    this.state={boardId:board.id,size:board.size,lines,startedAt:Date.now()};
    this.timer=setTimeout(()=>this.stop(),DURATION);
    this.render(board);
  }
  render(board){
    this.detach();
    const state=this.state;if(!state)return;
    const elapsed=Date.now()-state.startedAt;
    const reduced=this.root.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const valid=board&&board.id===state.boardId&&board.size===state.size&&!board.archived&&
      state.lines.every(line=>line.indexes.every(i=>board.cells[i]?.done&&board.cells[i].title.trim()));
    if(!valid||reduced||elapsed>=DURATION){this.stop();return;}
    const grid=this.root.querySelector('.bg-grid');
    if(!grid||grid.dataset.boardId!==state.boardId)return;
    const doc=this.root.ownerDocument;
    const cells=Array.from(grid.children).filter(node=>node.classList.contains('bg-cell'));
    const layer=doc.createElement('div');layer.className='bg-bingo-effects';layer.setAttribute('aria-hidden','true');
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('bg-bingo-trails');svg.setAttribute('preserveAspectRatio','none');layer.appendChild(svg);
    const paths=state.lines.map((line,lineIndex)=>{
      const delay=lineIndex*100-elapsed;
      return {line,nodes:['bg-bingo-glow','bg-bingo-stroke'].map(cls=>{
        const node=doc.createElementNS(svg.namespaceURI,'line');node.classList.add('bg-bingo-line',cls);
        node.setAttribute('pathLength','1');node.style.animationDelay=delay+'ms';svg.appendChild(node);return node;
      })};
    });
    const toast=doc.createElement('div');toast.className='bg-bingo-toast';toast.style.animationDelay=(320-elapsed)+'ms';
    const title=doc.createElement('strong');title.textContent='BINGO!';toast.appendChild(title);
    const subtitle=doc.createElement('span');subtitle.textContent=state.lines.length>1?`${state.lines.length} 条连线，一起点亮`:'小小完成，值得庆祝';toast.appendChild(subtitle);layer.appendChild(toast);
    const particles=[];
    for(let i=0;i<20;i++){
      const piece=doc.createElement('span');piece.className='bg-bingo-confetti';
      const angle=(i/20)*Math.PI*2;
      piece.style.setProperty('--bg-burst-x',(Math.cos(angle)*(62+i%4*14))+'px');
      piece.style.setProperty('--bg-burst-y',(Math.sin(angle)*(55+i%3*18)-25)+'px');
      piece.style.setProperty('--bg-burst-spin',(i%2?240:-220)+'deg');
      piece.style.setProperty('--bg-burst-color',['var(--bg-accent)','#dfb953','#82a784','#b799c8'][i%4]);
      piece.style.animationDelay=(360+(i%5)*35-elapsed)+'ms';layer.appendChild(piece);particles.push(piece);
    }
    // One pulse per new winning cell, even when two lines share a cell.
    const delays=new Map();
    state.lines.forEach((line,li)=>line.indexes.forEach((index,ci)=>{
      const delay=li*100+ci*65;delays.set(index,Math.min(delays.get(index)??Infinity,delay));
    }));
    for(const [index,delay] of delays){cells[index]?.classList.add('bg-line-pop');cells[index]?.style.setProperty('--bg-pop-delay',(delay-elapsed)+'ms');}
    grid.appendChild(layer);
    const position=()=>{
      if(!layer.isConnected)return;
      const rect=grid.getBoundingClientRect();
      svg.setAttribute('viewBox',`0 0 ${rect.width||1} ${rect.height||1}`);
      const center=index=>{const r=cells[index].getBoundingClientRect();return {x:r.left+r.width/2-rect.left,y:r.top+r.height/2-rect.top};};
      let x=0,y=0;
      paths.forEach(({line,nodes})=>{
        const a=center(line.indexes[0]),b=center(line.indexes[line.indexes.length-1]);
        for(const node of nodes)for(const [key,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))node.setAttribute(key,String(value));
        x+=(a.x+b.x)/2;y+=(a.y+b.y)/2;
      });
      x/=paths.length;y/=paths.length;
      for(const node of [toast,...particles]){node.style.left=x+'px';node.style.top=y+'px';}
    };
    position();
    const ResizeObserver=doc.defaultView.ResizeObserver;
    if(ResizeObserver){this.observer=new ResizeObserver(position);this.observer.observe(grid);}
  }
  destroy(){this.stop();}
}
module.exports={BingoCelebration};
