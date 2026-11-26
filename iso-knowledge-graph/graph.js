import { integrateTerms, attachTermView } from './integrate-terms.js';
import { mountTerms } from './terms/app.js?v=20261126-1';
'use strict';
const $ = id => document.getElementById(id);
const model = JSON.parse($('model').textContent);
const termData = JSON.parse($('displayData').textContent);
integrateTerms(model, termData);
let selectTerm;
function openTermDetails(id, scope) {
 setTab('terms');
 if (!selectTerm) {
  const root = attachTermView($('termsTemplate'), $('termsView'));
  selectTerm = mountTerms(root, termData);
 }
 if (id || scope) selectTerm(id, scope);
}
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
const lookup=new Map(values.map(n=>[n.id,norm([nice(n),n.en,n.keywords||'',n.abbr||'',n.title||'',n.group||'',n.kind==='Standard'?n.label.replace(/ISO\/(IEC|UNDP)/,'ISO'):'',n.kind==='Clause'?nodes[n.owner].label:''].join(' '))]));
function matches(n,raw){
 const terms=raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return terms.every(t=>lookup.get(n.id).includes(norm(t)));
}
function setTab(t){
 $('termsView').hidden=t!=='terms';
 state.tab=t; $('mapView').hidden=t!=='map'; $('graphView').hidden=t!=='graph';$('dictView').hidden=t!=='dict';
 for (const [id,val] of [['graphTab','graph'],['dictTab','dict'],['mapTab','map'],['termsTab','terms']]){
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
 const top=el('div','','eyeline');top.append(el('span','선택한 항목'),badge(n));wrap.append(top);
 wrap.append(el('h2',n.label));
 if(n.kind==='Clause')wrap.append(el('p',nodes[n.owner].label+' · 판본별 조항','tagline'));
 if(n.kind==='Standard')wrap.append(el('p',n.title+' · '+n.group,'tagline'));
 if(n.en)wrap.append(el('p',(n.abbr?n.abbr+'  /  ':'')+n.en,'english'));
 wrap.append(el('p',n.desc,'explain'));
 const scope = {s9001:'q',s14001:'e',s19011:'u',s42001:'i'}[n.id];
 if (n.termId || scope) {
  wrap.append(btn('표준별 용어 해설과 교재 근거', () => {
   openTermDetails(n.termId, scope);
   $('termsView').scrollIntoView({block:'start'});
  }, 'inspect-action'));
 }
 if(n.amend)wrap.append(el('p',n.amend,'tagline'));
 if(n.kind==='Example')wrap.append(el('p','교육용 가상 사례 · 실제 심사기록이나 필수 서식과 구분합니다.','tagline'));
 if(state.anchor!==n.id)wrap.append(btn('이 항목의 전체 연결 보기 →',()=>returnToGraph(n.id),'inspect-action'));
 wrap.append(el('hr','','sectionline'),el('h3',n.kind==='Example'?'관련 규격·학습 자료':'출처'));
 for(const key of n.refs){
  const s=sources[key],link=el('a',s.label+' ↗','source');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);
 }
 const ns=neighbors.get(n.id);
 wrap.append(el('hr','','sectionline'),el('h3','직접 연결 '+ns.length+'개'));
 const list=el('div','','relations');wrap.append(list);
 for(const ed of ns){
  const out=ed.s===n.id, other=nodes[out?ed.o:ed.s];
  const row=btn('',()=>returnToGraph(other.id),'rel');
  const left=el('span',out?'→ '+types[ed.p][0]:'← '+types[ed.p][0]);left.append(el('small',basis[ed.basis]+(out?' · 나가는 연결':' · 들어오는 연결')));
  row.setAttribute('aria-label',nice(nodes[ed.s])+' → '+types[ed.p][0]+' → '+nice(nodes[ed.o])+'. '+nice(other)+' 탐색');
  row.append(left,el('b',nice(other)));list.append(row);
 }
 $('announce').textContent=nice(n)+' 선택. 직접 연결 '+ns.length+'개.';
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
 const step=compact?95:88, first=44;
 let h=sc?first*2+step*(sc.rows.length-1):Math.max(210,Math.max(1,visible.length)*82+42);
 stage.replaceChildren();stage.style.height=h+'px';
 const svg=svgEl('svg',{viewBox:'0 0 '+w+' '+h,'aria-hidden':'true',focusable:'false'});stage.append(svg);
 const defs=svgEl('defs',{}), marker=svgEl('marker',{id:'arr',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});
 marker.append(svgEl('path',{d:'M0 0 L8 4 L0 8 Z',fill:'#bad0be'}));defs.append(marker);svg.append(defs);
 const xy={}, captions=[];
 function place(id,x,y,width){
  const n=nodes[id],b=btn('',()=>pick(id),'node'+(id===state.selected?' selected':''));
  b.dataset.kind=n.kind;b.dataset.id=id;b.style.left=x+'px';b.style.top=y+'px';b.style.width=width+'px';
  b.setAttribute('aria-label',nice(n)+' 상세 보기');b.setAttribute('aria-pressed',String(id===state.selected));
  let meta=kinds[n.kind],label=n.label;
  if(n.kind==='Standard'){meta='규격 · '+n.label.split(':')[1];label=n.short}
  if(n.kind==='Clause'){meta=(state.scene?'조항':nodes[n.owner].short)+' · '+n.number;label=n.title;if(id==='a614')meta+=' · 기획';if(id==='a84')meta+=' · 운영'}
  b.append(el('small',symbols[n.kind]+' '+meta),el('b',label));stage.append(b);
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
  $('sceneTitle').textContent=sc.title;$('sceneSub').textContent='항목을 선택하면 정의와 출처를 볼 수 있습니다.';$('caption').textContent=sc.caption;
 }else{
  const anc=nodes[state.anchor],nx=w*(compact?.20:.22),ox=w*(compact?.80:.78);
  const bw=Math.min(compact?w*.34:174,w*.35),ow=Math.min(compact?w*.35:186,w*.36);
  place(anc.id,nx,h/2,bw);
  const endpoints = new Map();
  for(const [idx,e] of visible.entries()){
   const forward=anc.id===e.s,other=forward?e.o:e.s,oy=visible.length===1?h/2:40+(h-80)*idx/(visible.length-1);
   place(other,ox,oy,ow);
   endpoints.set(e, xy[other]);
  }
  const a=xy[anc.id];
  for(const e of visible){
   const forward=anc.id===e.s,b=endpoints.get(e);
   const x1=a.x+a.w/2+4,x2=b.x-b.w/2-4,dx=x2-x1,mid=(x1+x2)/2;
   const bend=x1+dx*.47;
   wire('M '+x1+' '+a.y+' C '+bend+' '+a.y+' '+(x1+dx*.16)+' '+b.y+' '+mid+' '+b.y+' L '+x2+' '+b.y,types[e.p][0],x1+dx*.70,b.y-10,!forward);
  }
  $('sceneTitle').textContent=nice(anc);$('sceneSub').textContent='선택 항목의 직접 연결 · '+adj.length+'개';$('caption').textContent='화살표는 관계의 출발 항목에서 도착 항목을 가리킵니다. 연결된 항목을 선택해 정의를 확인할 수 있습니다.';
 }
 for(const [x,y,s] of captions)pointText(svg,x,y,s);
 for(const b of $('scenes').children){const active=b.dataset.id===state.scene;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active))}
 $('pages').hidden=Boolean(sc)||adj.length<=pageSize;
 if(!sc){$('pagecount').textContent=(state.page+1)+' / '+Math.ceil(adj.length/pageSize);$('prev').disabled=state.page===0;$('next').disabled=start+pageSize>=adj.length}
}
function showHits(){
 const val=$('search').value.trim(),box=$('hits');box.replaceChildren();box.hidden=!val;if(!val)return;
 const found=values.filter(n=>matches(n,val));
 if(!found.length){box.append(el('p','일치하는 항목이 없습니다.'));return}
 for(const n of found.slice(0,10)){
  const b=btn('',()=>{explore(n.id);$('sceneTitle').scrollIntoView({block:'nearest'})});b.append(badge(n),el('span',nice(n)));box.append(b);
 }
 if(found.length>10)box.append(btn('사전에서 '+found.length+'개 모두 보기 →',()=>{$('dictSearch').value=val;$('kind').value='';setTab('dict')}));
}
function renderCatalog(){
 const list=$('catRows'),filter=$('kind').value,raw=$('dictSearch').value;
 list.replaceChildren();const found=values.filter(n=>(!filter||n.kind===filter)&&matches(n,raw));
 $('catCount').textContent=found.length+'개 항목';
 for(const n of found){
  const tr=el('tr'),one=el('td'),two=el('td');one.append(badge(n));
  two.append(btn(nice(n),()=>{explore(n.id);$('graphView').scrollIntoView({block:'start'})}));
  two.append(el('small',n.kind==='Standard'?n.title:n.abbr||n.en||''));
  tr.append(one,two,el('td',n.desc));list.append(tr);
 }
 if(!found.length){const td=el('td','일치하는 항목이 없습니다.');td.colSpan=3;const tr=el('tr');tr.append(td);list.append(tr)}
}
$('termsTab').onclick=()=>openTermDetails();
$('mapTab').onclick=()=>setTab('map');
for(const b of $('mapView').querySelectorAll('[data-target]'))b.addEventListener('click',()=>returnToGraph(b.dataset.target));
$('graphTab').onclick=()=>setTab('graph');$('dictTab').onclick=()=>setTab('dict');
for(const [id,sc] of Object.entries(scenes)){const b=btn(sc.label,()=>chooseScene(id));b.dataset.id=id;$('scenes').append(b)}
for(const role of ['경영시스템 요구사항','기본 개념·용어','심사 지침','인증기관 요구사항']){
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
$('footCount').textContent=Object.entries(kinds).map(([k,v])=>v+' '+values.filter(n=>n.kind===k).length).join('  ·  ')+'  |  연결 '+edges.length;
let observedWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==observedWidth){observedWidth=width;draw()}}).observe($('stage'));
explore('qms');
const params = new URLSearchParams(location.search);
if (params.get('standard') === '14001') openTermDetails('ems','e');
else if (params.get('view') === 'terms') openTermDetails();
