'use strict';
const $ = id => document.getElementById(id);
const model = JSON.parse($('model').textContent);
const {nodes, edges, types, kinds, scenes, sources, basis} = model;
const values = Object.values(nodes);
const symbols = {Standard:'▣', Clause:'§', Term:'●', Example:'◇'};
const neighbors = new Map(values.map(n => [n.id, edges.filter(e => e.s===n.id || e.o===n.id)]));
const state = {tab:'graph', scene:'audit', selected:'finding', anchor:null, page:0};
const pageSize = 4;
function el(tag, txt='', cls=''){
 const item=document.createElement(tag);
 if (txt) item.textContent=txt;
 if (cls) item.className=cls;
 return item;
}
function btn(txt, fn, cls=''){
 const b=el('button',txt,cls); b.type='button'; b.addEventListener('click',fn); return b;
}
function nice(n){
 if(n.kind==='Clause') return nodes[n.owner].short+' §'+n.number+' '+n.title;
 return n.label;
}
function norm(v){return v.toLowerCase().normalize('NFKC').replace(/[\s/·_-]+/g,'')}
const lookup=new Map(values.map(n=>[n.id,norm([nice(n),n.en,n.abbr||'',n.title||'',n.group||'',n.kind==='Standard'?n.label.replace(/ISO\/(IEC|UNDP)/,'ISO'):'',n.kind==='Clause'?nodes[n.owner].label:''].join(' '))]));
function matches(n,raw){
 const terms=raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return terms.every(t=>lookup.get(n.id).includes(norm(t)));
}
function setTab(t){
 state.tab=t; $('mapView').hidden=t!=='map'; $('graphView').hidden=t!=='graph';$('dictView').hidden=t!=='dict';
 for (const [id,val] of [['graphTab','graph'],['dictTab','dict'],['mapTab','map']]){
  $(id).classList.toggle('on',val===t); $(id).setAttribute('aria-pressed',String(val===t));
 }
 $('hits').hidden=true;
 if(t==='graph') draw(); else if(t==='dict') renderCatalog();
}
function chooseScene(id){
 state.scene=id; state.anchor=null; state.selected=scenes[id].focus; state.page=0;
 $('standard').value='';$('search').value='';$('hits').hidden=true;setTab('graph');detail();
}
function explore(id){
 state.anchor=id;state.selected=id;state.page=0;state.scene=null;
 $('standard').value=nodes[id].kind==='Standard'?id:'';
 $('search').value='';$('hits').hidden=true;setTab('graph');detail();
}
function pick(id){
 state.selected=id;
 for(const b of $('stage').querySelectorAll('button[data-id]')){
  b.classList.toggle('selected',b.dataset.id===id);
  b.setAttribute('aria-pressed',String(b.dataset.id===id));
 }
 detail();
 if(window.matchMedia('(max-width:700px)').matches) $('inspector').scrollIntoView({block:'start'});
}
function returnToGraph(id){
 explore(id);
 if(window.matchMedia('(max-width:700px)').matches) $('stage').scrollIntoView({block:'center'});
}
function badge(n){return el('span',kinds[n.kind],'badge '+n.kind)}
function detail(){
 const n=nodes[state.selected], wrap=$('inspector');wrap.replaceChildren();
 const top=el('div','','eyeline');top.append(el('span','Selected item'),badge(n));wrap.append(top);
 wrap.append(el('h2',n.label));
 if(n.kind==='Clause')wrap.append(el('p',nodes[n.owner].label+' · Edition-specific clause','tagline'));
 if(n.kind==='Standard')wrap.append(el('p',n.title+' · '+n.group,'tagline'));
 if(n.abbr)wrap.append(el('p',n.abbr,'english'));
 wrap.append(el('p',n.desc,'explain'));
 if(n.amend)wrap.append(el('p',n.amend,'tagline'));
 if(n.kind==='Example')wrap.append(el('p','Illustrative case developed for training.','tagline'));
 if(state.anchor!==n.id)wrap.append(btn('Explore all connections',()=>returnToGraph(n.id),'inspect-action'));
 wrap.append(el('hr','','sectionline'),el('h3',n.kind==='Example'?'Related standards and learning resources':'Sources'));
 for(const key of n.refs){
  const s=sources[key],link=el('a',s.label+' ↗','source');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);
 }
 const ns=neighbors.get(n.id);
 wrap.append(el('hr','','sectionline'),el('h3','Direct connections ('+ns.length+')'));
 const list=el('div','','relations');wrap.append(list);
 for(const ed of ns){
  const out=ed.s===n.id, other=nodes[out?ed.o:ed.s];
  const row=btn('',()=>returnToGraph(other.id),'rel');
  const left=el('span',out?'→ '+types[ed.p][0]:'← '+types[ed.p][0]);left.append(el('small',basis[ed.basis]+(out?' · Outgoing':' · Incoming')));
  row.setAttribute('aria-label',nice(nodes[ed.s])+' → '+types[ed.p][0]+' → '+nice(nodes[ed.o])+'. '+'Explore '+nice(other));
  row.append(left,el('b',nice(other)));list.append(row);
 }
 $('announce').textContent=nice(n)+' selected. Direct connections: '+ns.length+'.';
}
const svgNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs){
 const n=document.createElementNS(svgNS,tag);
 for(const [key,value] of Object.entries(attrs))n.setAttribute(key,value);
 return n;
}
function pointText(svg,x,y,text){
 const g=svgEl('g',{}),t=svgEl('text',{x,y,'text-anchor':'middle','dominant-baseline':'central',fill:'#e0ebe3','font-size':11.3,'font-weight':500});
 t.textContent=text;g.append(t);svg.append(g);const box=t.getBBox();
 g.insertBefore(svgEl('rect',{x:box.x-4,y:box.y-1,width:box.width+8,height:box.height+2,rx:3,fill:'#143c39'}),t);
}
function draw(){
 if(state.tab!=='graph') return;
 const stage=$('stage'), w=stage.clientWidth;
 if(!w)return;
 const sc=state.scene&&scenes[state.scene], compact=w<460;
 const adj=state.anchor?neighbors.get(state.anchor):[];
 const start=state.page*pageSize, visible=adj.slice(start,start+pageSize);
 const step=compact?132:106, first=62;
 let h=sc?first*2+step*(sc.rows.length-1):Math.max(245,Math.max(1,visible.length)*(compact?116:92)+80);
 stage.replaceChildren();stage.style.height=h+'px';
 const svg=svgEl('svg',{viewBox:'0 0 '+w+' '+h,'aria-hidden':'true',focusable:'false'});stage.append(svg);
 const defs=svgEl('defs',{}), marker=svgEl('marker',{id:'arr',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});
 marker.append(svgEl('path',{d:'M0 0 L8 4 L0 8 Z',fill:'#bad0be'}));defs.append(marker);svg.append(defs);
 const xy={}, captions=[];
 function place(id,x,y,width){
  const n=nodes[id],b=btn('',()=>pick(id),'node'+(id===state.selected?' selected':''));
  b.dataset.kind=n.kind;b.dataset.id=id;b.style.left=x+'px';b.style.top=y+'px';b.style.width=width+'px';
  b.setAttribute('aria-label',nice(n)+' details');b.setAttribute('aria-pressed',String(id===state.selected));
  let meta=kinds[n.kind],label=n.label;
  if(n.kind==='Standard'){meta='Standard · '+n.label.split(':')[1];label=n.short}
  if(n.kind==='Clause'){meta=(state.scene?'Clause':nodes[n.owner].short)+' · '+n.number;label=n.title;if(id==='a614')meta+=' · Planning';if(id==='a84')meta+=' · Operation'}
  b.append(el('small',symbols[n.kind]+' '+meta),el('b',compact && n.abbr ? n.abbr : label));stage.append(b);
  xy[id]={x,y,w:width,h:b.offsetHeight};
 }
 function wire(d,label,x,y,reverse=false){
  const spec={d,fill:'none',stroke:'#9ebdaf','stroke-width':1.45};spec[reverse?'marker-start':'marker-end']='url(#arr)';
  svg.append(svgEl('path',spec)); captions.push([x,y,label]);
 }
 if(sc){
  for(const [r,row] of sc.rows.entries()){
   row.forEach((id,i)=>place(id,w*(row.length===1?.5:(i===0?.25:.75)),first+r*step,Math.min(compact?143:172,(w-34)/2)));
  }
  for(const src of sc.links){
   const [from,p,to]=src.split(' '),a=xy[from],b=xy[to];
   const x1=a.x,y1=a.y+a.h/2+2,x2=b.x,y2=b.y-b.h/2-3,mid=(y1+y2)/2;
   wire('M '+x1+' '+y1+' C '+x1+' '+mid+' '+x2+' '+mid+' '+x2+' '+y2,types[p][0],(x1+x2)/2,mid);
  }
  $('sceneTitle').textContent=sc.title;$('sceneSub').textContent='Select an item to see its definition and sources.';$('caption').textContent=sc.caption;
 }else{
  const anc=nodes[state.anchor],nx=w*(compact?.20:.22),ox=w*(compact?.80:.78);
  const bw=Math.min(compact?w*.34:174,w*.35),ow=Math.min(compact?w*.35:186,w*.36);
  place(anc.id,nx,h/2,bw);
  for(const [idx,e] of visible.entries()){
   const forward=anc.id===e.s,other=forward?e.o:e.s,oy=visible.length===1?h/2:64+(h-128)*idx/(visible.length-1);
   place(other,ox,oy,ow);
  }
  const a=xy[anc.id];
  for(const e of visible){
   const forward=anc.id===e.s,b=xy[forward?e.o:e.s];
   const x1=a.x+a.w/2+4,x2=b.x-b.w/2-4,dx=x2-x1,mid=(x1+x2)/2;
   const bend=x1+dx*.47;
   wire('M '+x1+' '+a.y+' C '+bend+' '+a.y+' '+(x1+dx*.16)+' '+b.y+' '+mid+' '+b.y+' L '+x2+' '+b.y,types[e.p][0],compact?(x1+x2)/2:x1+dx*.55,compact?b.y-25:b.y-12,!forward);
  }
  $('sceneTitle').textContent=nice(anc);$('sceneSub').textContent='Direct connections: '+adj.length;$('caption').textContent='Arrows point from the source to the target. Select a connected item to inspect its definition.';
 }
 for(const [x,y,s] of captions)pointText(svg,x,y,s);
 for(const b of $('scenes').children){const active=b.dataset.id===state.scene;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active))}
 $('pages').hidden=Boolean(sc)||adj.length<=pageSize;
 if(!sc){$('pagecount').textContent=(state.page+1)+' / '+Math.ceil(adj.length/pageSize);$('prev').disabled=state.page===0;$('next').disabled=start+pageSize>=adj.length}
}
function showHits(){
 const val=$('search').value.trim(),box=$('hits');box.replaceChildren();box.hidden=!val;if(!val)return;
 const found=values.filter(n=>matches(n,val));
 if(!found.length){box.append(el('p','No matching items. Try a different search.'));return}
 for(const n of found.slice(0,10)){
  const b=btn('',()=>{explore(n.id);$('sceneTitle').scrollIntoView({block:'nearest'})});b.append(badge(n),el('span',nice(n)));box.append(b);
 }
 if(found.length>10)box.append(btn('See all '+found.length+' results in the dictionary',()=>{$('dictSearch').value=val;$('kind').value='';setTab('dict')}));
}
function renderCatalog(){
 const list=$('catRows'),filter=$('kind').value,raw=$('dictSearch').value;
 list.replaceChildren();const found=values.filter(n=>(!filter||n.kind===filter)&&matches(n,raw));
 $('catCount').textContent=found.length+' items';
 for(const n of found){
  const tr=el('tr'),one=el('td'),two=el('td');one.append(badge(n));
  two.append(btn(nice(n),()=>{explore(n.id);$('graphView').scrollIntoView({block:'start'})}));
  two.append(el('small',n.kind==='Standard'?n.title:n.abbr||''));
  tr.append(one,two,el('td',n.desc));list.append(tr);
 }
 if(!found.length){const td=el('td','No matching items. Try a different search.');td.colSpan=3;const tr=el('tr');tr.append(td);list.append(tr)}
}
$('mapTab').onclick=()=>setTab('map');
for(const b of $('mapView').querySelectorAll('[data-target]'))b.addEventListener('click',()=>returnToGraph(b.dataset.target));
$('graphTab').onclick=()=>setTab('graph');$('dictTab').onclick=()=>setTab('dict');
for(const [id,sc] of Object.entries(scenes)){const b=btn(sc.label,()=>chooseScene(id));b.dataset.id=id;$('scenes').append(b)}
for(const role of ['Management system requirements','Fundamentals and vocabulary','Auditing guidance','Certification body requirements']){
 const g=el('optgroup');g.label=role;
 for(const n of values.filter(n=>n.group===role)){const o=el('option',n.label+' · '+n.title);o.value=n.id;g.append(o)}$('standard').append(g);
}
$('standard').onchange=e=>e.target.value?explore(e.target.value):chooseScene('audit');
$('search').oninput=showHits;$('search').onfocus=showHits;
$('search').onkeydown=e=>{
 if(e.key==='Escape')$('hits').hidden=true;
 if(!e.isComposing && ['Enter','ArrowDown'].includes(e.key)&&!$('hits').hidden){
  const first=$('hits').querySelector('button');if(first){e.preventDefault();if(e.key==='Enter')first.click();else first.focus()}
 }
};
$('hits').addEventListener('keydown',e=>{if(e.key==='Escape'){$('search').focus();$('hits').hidden=true}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.searchbox'))$('hits').hidden=true});
document.addEventListener('focusin',e=>{if(!e.target.closest('.searchbox'))$('hits').hidden=true});
for(const [val,name] of Object.entries(kinds)){const o=el('option',name);o.value=val;$('kind').append(o)}
$('dictSearch').oninput=renderCatalog;$('kind').onchange=renderCatalog;
for(const [key,d] of Object.entries(model.classnotes))$('classlist').append(el('p',kinds[key]+' — '+d));
for(const [label,domain,range,desc] of Object.values(types)){const tr=el('tr');tr.append(el('td',label),el('td',kinds[domain]+' → '+kinds[range]),el('td',desc));$('properties').append(tr)}
$('prev').onclick=()=>{if(state.page>0){state.page--; state.selected=state.anchor;draw();detail()}};
$('next').onclick=()=>{if((state.page+1)*pageSize<neighbors.get(state.anchor).length){state.page++;state.selected=state.anchor;draw();detail()}};
$('footCount').textContent=Object.entries(kinds).map(([k,v])=>v+' '+values.filter(n=>n.kind===k).length).join('  ·  ')+'  |  Relationships: '+edges.length;
let observedWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==observedWidth){observedWidth=width;draw()}}).observe($('stage'));
chooseScene('audit');
