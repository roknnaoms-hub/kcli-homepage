'use strict';
export function mountTerms(root, D) {
const $=id=>root.getElementById(id);
const {standard,books,sources}=D;
const st={id:'ms',std:'all',view:'graph',mode:'local',page:0,route:5};
const byId=new Map(D.nodes.map(n=>[n.id,n])),collator=new Intl.Collator('ko',{numeric:true});
const adjacent=new Map(D.nodes.map(n=>[n.id,D.edges.filter(e=>e.s===n.id||e.t===n.id)]));
const standardKeys=['q','e','u','i'], isStandard=()=>standardKeys.includes(st.std);
const activeUses=n=>n.uses.filter(u=>!isStandard()||u.std===st.std);
const eligible=n=>st.std==='common'?n.uses.length>1:activeUses(n).length>0;
const edgeAllowed=e=>(!isStandard()||Object.hasOwn(e.notes,st.std))&&(st.std!=='common'||[e.s,e.t].every(id=>byId.get(id).uses.length>1));
const linksFor=id=>{
 const list=adjacent.get(id).filter(edgeAllowed);
 if(id!=='ms'||st.std!=='all')return list;
 const rank=['qms','ems','aims','audit','policy','goal'];
 const priority=e=>{const i=rank.indexOf(other(e,id).id);return i<0?rank.length:i;};
 return list.sort((a,b)=>priority(a)-priority(b));
};
const other=(e,id)=>byId.get(e.s===id?e.t:e.s);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pill=v=>'<span class="tag">'+esc(v)+'</span>';
const color=n=>D.types[n.cat][1];
const kind=k=>'<span class="key"><i class="dot" style="--c:'+D.types[k][1]+'"></i>'+D.types[k][0]+'</span>';
const normalize=v=>v.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
const mini={q:'9001',e:'14001',u:'19011',i:'42001'};
function clauseText(u){return [(u.term?'정의 '+u.term:''),u.clauses.length?'관련 '+u.clauses.join(' · '):''].filter(Boolean).join('  /  ');}
function compact(n){const all=activeUses(n);if(!all.length)return '';if(!isStandard()&&all.length>1)return all.map(u=>mini[u.std]).join(' · ');const u=all[0];return mini[u.std]+(u.term||u.clauses[0]?' § '+(u.term||u.clauses[0]):'');}
function refGroups(refs,showTitles=false){
 const map=new Map();
 for(const r of refs){const v=sources[r],doc=books[v.book];if(!map.has(doc))map.set(doc,[]);map.get(doc).push(v);}
 return [...map].map(([book,pages])=>esc(book.label)+' · '+(book.unit==='슬라이드'?'슬라이드 ':'PDF ')+pages.map(v=>v.page).sort((a,b)=>a-b).join(', ')+(book.unit==='쪽'?'쪽':'')+(showTitles&&book.unit==='슬라이드'?'<ul>'+pages.map(v=>'<li>'+v.page+' · '+esc(v.title)+'</li>').join('')+'</ul>':'')).join('<br>');
}
const anchors={all:'ms',q:'qms',e:'ems',u:'audit',i:'aims',common:'audit'};
function english(n){return activeUses(n).find(u=>u.std===st.std)?.englishLabel||n.en;}
function matches(n){
 if(!eligible(n))return false;
 const type=$('type').value,chapter=$('chapter').value, value=normalize($('query').value.trim());
 if(type&&type!==n.cat)return false;
 const uses=activeUses(n).filter(u=>!chapter||(chapter==='3'?u.term:[u.term,...u.clauses].filter(Boolean).some(c=>c.split('.')[0]===chapter)));
 if(!uses.length)return false;
 if(!value)return true;
 if(/^(?:a\.)?\d+(\.\d+)*\.?$/i.test(value)){
  return uses.some(u=>[u.term,...u.clauses].filter(Boolean).some(c=>c.toLowerCase()===value||c.toLowerCase().startsWith(value.endsWith('.')?value:value+'.')));
 }
 return [n.ko,english(n),n.aliases,...activeUses(n).map(u=>u.englishLabel||'')].some(v=>normalize(v).includes(value));
}
const subset=()=>D.nodes.filter(matches);
const sorted=list=>list.slice().sort((a,b)=>collator.compare(a.ko,b.ko));
function chapterMenu(){
 const q={3:'용어와 정의',4:'조직상황',5:'리더십',6:'기획',7:'지원',8:'운용',9:'성과 평가',10:'개선',A:'부속서 A'};
 const audit={3:'용어와 정의',4:'심사 원칙',5:'심사프로그램 관리',6:'심사 수행',7:'역량 및 평가'};
 const options=st.std==='u'?audit:st.std==='i'?q:['q','e'].includes(st.std)?Object.fromEntries(Object.entries(q).filter(([k])=>k!=='A')):Object.fromEntries(Object.keys(q).map(k=>[k,k==='3'?'용어와 정의':'']));
 $('chapter').innerHTML='<option value="">모든 조항</option>'+Object.entries(options).map(([k,v])=>'<option value="'+k+'">'+(k==='A'?'부속서 A':'제'+k+'항'+(v?' · '+v:''))+'</option>').join('');
}
function buttonNames(){
 $('nTerms').textContent=D.nodes.length;$('nEdges').textContent=D.edges.length;$('nCore').textContent=D.nodes.filter(n=>n.uses.length>1).length;
 $('type').innerHTML='<option value="">모든 용어 유형</option>'+Object.entries(D.types).map(([k,v])=>'<option value="'+k+'">'+v[0]+'</option>').join('');
 $('legend').innerHTML=Object.keys(D.types).map(kind).join('');
 $('standards').innerHTML=[['all','통합 보기'],...standardKeys.map(s=>[s,standard[s].name]),['common','공통 용어']].map(([k,v])=>'<button data-standard="'+k+'" aria-pressed="false">'+esc(v)+'</button>').join('');
 chapterMenu();
}
function updateDetails(){
 const n=byId.get(st.id),links=linksFor(n.id);
 const rows=[...n.uses].sort((a,b)=>Number(b.std===st.std)-Number(a.std===st.std));
 function usage(u){const badge='<div class="usehead"><strong>'+standard[u.std].name+'</strong><span>'+standard[u.std].topic+'</span></div>';
 return '<section class="usebox" data-std="'+u.std+'">'+badge+'<p>'+esc(u.meaning)+'</p><div class="tagrow">'+(u.term?pill('정의 '+u.term):'')+u.clauses.map(c=>pill('관련 '+c)).join('')+'</div><details class="sourcesline"><summary>교재 근거</summary>'+refGroups(u.refs,true)+'</details></section>';}
 $('detail').innerHTML='<div class="eyebrow">'+kind(n.cat)+'<span>·</span><span>'+n.uses.length+'개 표준에서 사용</span></div><h2>'+esc(n.ko)+'</h2><p class="eng" lang="en">'+esc(english(n))+'</p>'+rows.map(usage).join('')+'<div class="question"><strong>심사 질문 예시 · '+mini[n.questionScope]+'</strong><p>'+esc(n.q)+'</p></div>';
 $('relationCount').textContent=links.length+'개 관계';
 $('relations').innerHTML=links.map(e=>{
  const t=other(e,n.id), evidence=Object.entries(e.notes).filter(([s])=>!isStandard()||st.std===s).map(([s,note])=>'<p class="subtle"><b>'+standard[s].name+'</b></p><p>'+esc(note)+'</p><div class="subtle">'+refGroups(e.refs.filter(r=>books[sources[r].book].std===s))+'</div>').join('');
  return '<details class="relitem"><summary>'+esc(byId.get(e.s).ko)+' → <strong>'+esc(D.pred[e.k])+'</strong> → '+esc(byId.get(e.t).ko)+'</summary><div class="relnote">'+evidence+'<button class="textbtn" data-go="'+t.id+'">'+esc(t.ko)+' 탐색</button></div></details>';
 }).join('')||'<p class="subtle">현재 범위에 직접 연결된 용어가 없습니다. 통합 보기에서 전체 관계를 확인하세요.</p>';
}
function routePanel(){
 const options=D.routes.map((r,i)=>({r,i})).filter(({r})=>st.std==='all'||r.std===st.std);
 if(!options.some(({i})=>i===st.route))st.route=options[0].i;
 const r=D.routes[st.route];$('routes').innerHTML=options.map(({r,i})=>'<button data-route="'+i+'" aria-pressed="'+(st.route===i)+'">'+esc(r.title)+'</button>').join('');
 $('routeText').textContent=r.note;
 $('steps').innerHTML=r.ids.map((id,i)=>(i?'<span aria-hidden="true">›</span>':'')+'<button data-go="'+id+'" aria-current="'+(st.id===id)+'">'+esc(byId.get(id).ko)+'</button>').join('');
}
function catalog(found){
 $('dictCount').textContent=found.length+'개 용어';
 $('tbody').innerHTML=sorted(found).map(n=>'<tr><td><button data-go="'+n.id+'">'+esc(n.ko)+'</button><small lang="en">'+esc(english(n))+'</small></td><td>'+kind(n.cat)+'</td><td colspan="2">'+activeUses(n).map(u=>'<div class="catalogUse"><b>'+standard[u.std].name+'</b> '+esc(clauseText(u))+'</div>').join('')+'</td></tr>').join('');
}
function btnLabel(g,n){return 'class="clicknode" data-id="'+n.id+'" role="button" tabindex="0" aria-label="'+esc(n.ko+' · '+g)+'"';}
function glyph(cat,x,y,scale=1){
 const paths={s:'<path d="m0-8 8 4-8 4-8-4zM-8 1l8 4 8-4m-16 5 8 4 8-4"/>',p:'<path d="M-6 9V-8m0 0h12l-3 4 3 4H-6"/>',a:'<circle cx="-5" cy="1" r="2.5"/><circle cx="5" cy="-6" r="2.5"/><circle cx="6" cy="7" r="2.5"/><path d="m-3-1 6-4m-6 7 7 4"/>',r:'<path d="M-6-8H3l4 4V8H-6zm9 0v5h4M-3 1h7m-7 4h5"/>'};
 return '<g transform="translate('+x+' '+y+') scale('+scale+')" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">'+paths[cat]+'</g>';
}
const defs='<defs><marker id="arrow" viewBox="0 0 10 8" refX="8.6" refY="4" markerWidth="8" markerHeight="6.5" orient="auto"><path d="M0 0 9 4 0 8z" fill="#99b9bd"/></marker><marker id="activeArrow" viewBox="0 0 10 8" refX="8.6" refY="4" markerWidth="8" markerHeight="7" orient="auto"><path d="M0 0 9 4 0 8z" fill="#9ce5d2"/></marker></defs>';
const uiText=(x,y,str,fill,size,opts='')=>'<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-size="'+size+'" text-anchor="middle" '+opts+'>'+esc(str)+'</text>';
function anchorLine(ax,ay,bx,by,ra,rb){
 const d=Math.hypot(bx-ax,by-ay)||1,dx=(bx-ax)/d,dy=(by-ay)/d;
 return [ax+dx*ra,ay+dy*ra,bx-dx*rb,by-dy*rb];
}
function svgLine(xy,stroke,width,marker='arrow',opacity=1){
 return '<line x1="'+xy[0]+'" y1="'+xy[1]+'" x2="'+xy[2]+'" y2="'+xy[3]+'" stroke="'+stroke+'" stroke-width="'+width+'" opacity="'+opacity+'" '+(marker?'marker-end="url(#'+marker+')"':'')+'/>';
}
function focusMap(){
 const root=byId.get(st.id), links=linksFor(root.id), slice=links.slice(st.page*6,st.page*6+6);
 const mobile=$('graphScroll').clientWidth<560;
 const W=mobile?400:800,H=mobile?425:355,cx=W/2,cy=mobile?201:157,rad=mobile?31:39;
 let slots;
 if(slice.length<=2){slots=mobile?[[90,86],[310,318]]:[[145,150],[655,150]];}
 else if(slice.length<=4){slots=mobile?[[87,75],[313,75],[87,318],[313,318]]:[[160,67],[640,67],[160,246],[640,246]];}
 else{slots=mobile?[[89,46],[311,46],[56,186],[344,186],[89,329],[311,329]]:[[180,51],[620,51],[105,153],[695,153],[180,251],[620,251]];}
 const edgeSvg=[],nodeSvg=[];
 slice.forEach((e,i)=>{
  const [x,y]=slots[i],n=other(e,st.id),out=e.s===root.id,r=mobile?14:15,c=color(n),label=D.pred[e.k],L=out?anchorLine(cx,cy,x,y,rad+5,r+4):anchorLine(x,y,cx,cy,r+4,rad+5);
  edgeSvg.push(svgLine(L,'#799aa6',1.6));
  if(!mobile){
   const mx=(cx+x)/2,my=(cy+y)/2, width=Array.from(label).length*12.1+12;
   edgeSvg.push('<rect x="'+(mx-width/2)+'" y="'+(my-10)+'" width="'+width+'" height="20" rx="5" fill="#0c2836"/>',uiText(mx,my+4,label,'#b4cdd0',12.5));
  }
  nodeSvg.push('<g '+btnLabel('중심 용어로 선택',n)+' style="color:'+c+'"><title>'+esc(byId.get(e.s).ko+' → '+label+' → '+byId.get(e.t).ko)+'</title><rect x="'+(x-(mobile?53:73))+'" y="'+(y-23)+'" width="'+(mobile?106:146)+'" height="'+(mobile?86:79)+'" fill="transparent"/><circle cx="'+x+'" cy="'+y+'" r="'+(r+4)+'" fill="#132f3b" stroke="'+c+'" stroke-opacity=".24"/><circle class="ring" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#163744" stroke="'+c+'" stroke-width="1.7"/>'+glyph(n.cat,x,y,.9)+uiText(x,y+37,n.ko,'#f2f6f5',mobile?(n.ko.length>9?12:14.2):17,'font-weight="650"')+uiText(x,y+55,mobile?label:compact(n),mobile?'#bad0d3':c,mobile?10.8:13)+'</g>');
 });
 const col=color(root);
 const origin='<g style="color:'+col+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+(rad+13)+'" fill="none" stroke="'+col+'" stroke-opacity=".17" stroke-dasharray="2 5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(rad+6)+'" fill="#17434b" stroke="'+col+'" stroke-opacity=".26"/><circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="#133d46" stroke="'+col+'" stroke-width="2.2"/>'+(['qms','ems','aims','ms'].includes(root.id)?uiText(cx,cy+7,({qms:'QMS',ems:'EMS',aims:'AIMS',ms:'MS'})[root.id],col,mobile?20:23,'font-family="monospace" font-weight="750"'):glyph(root.cat,cx,cy,1.8))+uiText(cx,cy+rad+27,root.ko,'#ffffff',mobile?16:20,'font-weight="700"')+uiText(cx,cy+rad+46,'선택 용어',col,12.5)+'</g>';
 const g=$('net');g.setAttribute('viewBox','0 0 '+W+' '+H);g.setAttribute('class','net local');g.innerHTML=defs+edgeSvg.join('')+origin+nodeSvg.join('');
 $('mapCaption').textContent='선택 용어 중심 · 직접 관계 '+links.length+'개';
 $('mapHint').textContent=mobile?'노드를 눌러 용어를 탐색하세요.':'노드를 선택하면 해당 용어가 중심으로 이동합니다.';
 const pages=Math.ceil(links.length/6);$('pageCtl').hidden=pages<2;$('pageText').textContent=(st.page+1)+' / '+pages;
 $('prevPage').disabled=st.page===0;$('nextPage').disabled=st.page===pages-1;
}
function fullMap(found){
 const ids=new Set(found.map(n=>n.id)),links=D.edges.filter(e=>edgeAllowed(e)&&ids.has(e.s)&&ids.has(e.t)),near=new Set([st.id]);
 const lineSvg=[];
 for(const e of links){
  const hit=e.s===st.id||e.t===st.id;
  if(hit){near.add(e.s);near.add(e.t);}
  const a=byId.get(e.s),b=byId.get(e.t);
  const el=svgLine(anchorLine(...a.pos,...b.pos,a.id===st.id?12:8,b.id===st.id?13:9),hit?'#9ce5d2':'#7993a5',hit?2:1.2,hit?'activeArrow':'arrow',hit?.95:.47);
  if(hit)lineSvg.push(el);else lineSvg.unshift(el);
 }
 const labels=[],occupied=[];
 const display=[...found].sort((a,b)=>Number(b.id===st.id)-Number(a.id===st.id));
 for(const n of display){
  if(!near.has(n.id)&&found.length>12)continue;
  const [x,y]=n.pos,w=Array.from(n.ko).length*13+10;
  const candidates=[[-19,0],[24,0],[-18,20],[24,-20],[-31,0],[35,0],[0,60],[0,-60]];
  let box;
  for(const [dy,dx] of candidates){
   const lx=Math.max(w/2+1,Math.min(899-w/2,x+dx)),ly=Math.max(12,Math.min(489,y+dy));
   const b=[lx-w/2,ly-11,lx+w/2,ly+4];
   if(occupied.some(v=>!(v[2]<b[0]||v[0]>b[2]||v[3]<b[1]||v[1]>b[3])))continue;
   if(found.some(m=>m.id!==n.id&&m.pos[0]>b[0]-7&&m.pos[0]<b[2]+7&&m.pos[1]>b[1]-7&&m.pos[1]<b[3]+7))continue;
   box=b;break;
  }
  if(box){occupied.push(box);labels.push(uiText((box[0]+box[2])/2,box[1]+11,n.ko,n.id===st.id?'white':'#d3e8e6',13,'stroke="#0c2836" stroke-width="4" paint-order="stroke" pointer-events="none"'));}
 }
 const dots=found.map(n=>{const [x,y]=n.pos,hit=n.id===st.id;return '<g '+btnLabel('용어 강조',n)+'><title>'+esc(n.ko+' · '+n.en)+'</title><circle cx="'+x+'" cy="'+y+'" r="14" fill="transparent"/><circle class="ring" cx="'+x+'" cy="'+y+'" r="'+(hit?10:6.5)+'" fill="'+color(n)+'" stroke="'+(hit?'white':'#153946')+'" stroke-width="'+(hit?2.4:1.5)+'" opacity="'+(near.has(n.id)?1:.79)+'"/></g>';});
 const g=$('net');g.setAttribute('viewBox','0 0 900 500');g.setAttribute('class','net full');g.innerHTML=defs+lineSvg.join('')+dots.join('')+labels.join('');
 $('mapCaption').textContent='표시 용어 '+found.length+'개 · 관계 '+links.length+'개';$('pageCtl').hidden=true;
 $('mapHint').textContent='노드를 선택해 직접 연결을 강조하세요.';
}
function choose(id,opts={}){
 if(!byId.has(id))return;
 const n=byId.get(id);
 if(!eligible(n)){st.std='all';chapterMenu();}
 if(!matches(n)||opts.clear){$('query').value='';if(!matches(n)){$('chapter').value='';$('type').value='';}}
 st.id=id;st.page=0;st.view='graph';$('matches').hidden=true;render();$('live').textContent=n.ko+' 선택, 직접 관계 '+linksFor(id).length+'개';
 if(opts.scroll)root.querySelector('.graphcard').scrollIntoView({block:'start'});
}
function resetFilters(){$('query').value='';$('chapter').value='';$('type').value='';$('matches').hidden=true;}
function render(){
 root.querySelectorAll('[data-standard]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.standard===st.std)));
 const found=subset(),has=found.length>0,isGraph=st.view==='graph',filtered=Boolean($('query').value||$('chapter').value||$('type').value);
 if(has&&!found.some(n=>n.id===st.id)){st.id=found[0].id;st.page=0;}
 $('filterbar').hidden=!filtered;$('filterCount').textContent='조건에 맞는 용어 '+found.length+'개';$('clearQ').hidden=!$('query').value;
 $('graphTab').setAttribute('aria-pressed',String(isGraph));$('dictTab').setAttribute('aria-pressed',String(!isGraph));
 $('nocomplete').hidden=has;$('graphView').hidden=!isGraph||!has;$('dictView').hidden=isGraph||!has;
 $('localMode').setAttribute('aria-pressed',String(st.mode==='local'));$('allMode').setAttribute('aria-pressed',String(st.mode==='all'));
 if(!has)return;
 if(!isGraph){catalog(found);return;}
 updateDetails();routePanel();if(st.mode==='local'){focusMap();}else{fullMap(found);}
}
function suggestions(){
 const d=$('matches');
 if(!$('query').value||st.view!=='graph'){d.hidden=true;return;}
 const found=sorted(subset());
 d.innerHTML=found.length?found.map(n=>'<button class="suggest" data-pick="'+n.id+'"><span>'+esc(n.ko)+' <small class="meta">'+esc(english(n))+'</small></span>'+pill(compact(n))+'</button>').join(''):'<div class="empty">일치하는 용어가 없습니다.</div>';d.hidden=false;
}
$('graphTab').onclick=()=>{st.view='graph';render();};
$('dictTab').onclick=()=>{st.view='dict';$('matches').hidden=true;render();};
$('query').oninput=()=>{st.page=0;render();suggestions();};$('query').onfocus=suggestions;
$('query').onkeydown=e=>{
 if(e.key==='Escape'){$('matches').hidden=true;return;}
 if(e.isComposing)return;
 const b=$('matches').querySelector('button');
 if(b&&!$('matches').hidden&&e.key==='ArrowDown'){e.preventDefault();b.focus();}
 if(e.key==='Enter'&&st.view==='graph'&&subset().length){e.preventDefault();choose(subset().find(n=>normalize(n.ko)===normalize($('query').value))?.id||sorted(subset())[0].id,{clear:true});$('localMode').focus();}
};
$('clearQ').onclick=()=>{$('query').value='';$('matches').hidden=true;render();$('query').focus();};
for(const id of ['chapter','type'])$(id).onchange=()=>{st.page=0;$('matches').hidden=true;render();};
$('reset').onclick=()=>{resetFilters();st.page=0;render();};
$('home').onclick=()=>{resetFilters();st.mode='local';choose(anchors[st.std]);};
$('localMode').onclick=()=>{st.mode='local';st.page=0;render();};
$('allMode').onclick=()=>{st.mode='all';render();};
$('prevPage').onclick=()=>{if(st.page>0){st.page--;focusMap();}};
$('nextPage').onclick=()=>{if((st.page+1)*6<linksFor(st.id).length){st.page++;focusMap();}};
$('jump').onclick=()=>$('detailcard').scrollIntoView({block:'start'});
$('guide').onclick=()=>$('info').showModal();$('closeInfo').onclick=()=>$('info').close();
root.addEventListener('click',e=>{
 const scopeBtn=e.target.closest('[data-standard]');
 if(scopeBtn){st.std=scopeBtn.dataset.standard;st.id=anchors[st.std];st.route=({u:3,i:4,q:0,e:7,common:6,all:5})[st.std];st.page=0;chapterMenu();resetFilters();render();return;}
 const el=e.target.closest('[data-id],[data-pick],[data-go],[data-route]');
 if(el){
  if(el.dataset.route!==undefined){st.route=Number(el.dataset.route);st.mode='local';choose(D.routes[st.route].ids[0],{clear:true});}
  else if(el.dataset.id){choose(el.dataset.id,{clear:st.mode==='local'});}
  else{if(el.dataset.pick||el.dataset.go)st.mode='local';choose(el.dataset.pick||el.dataset.go,{clear:true,scroll:!!el.dataset.go});}
 }
 if(!e.target.closest('.search'))$('matches').hidden=true;
});
root.addEventListener('focusin',e=>{if(!e.target.closest('.search'))$('matches').hidden=true;});
root.addEventListener('keydown',e=>{
 if(e.key==='Escape')$('matches').hidden=true;
 if(e.target.matches('.clicknode')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose(e.target.dataset.id,{clear:st.mode==='local'});$('localMode').focus();}
});
let lastWidth=0;new ResizeObserver(entries=>{const w=Math.round(entries[0].contentRect.width);if(w&&lastWidth!==w){lastWidth=w;if(st.view==='graph'&&st.mode==='local')focusMap();}}).observe($('graphScroll'));
$('sourcebooks').innerHTML=Object.values(books).map(b=>'<li>'+esc(b.label)+' · '+esc(b.title)+'</li>').join('');
buttonNames();render();
return (id, scope = 'all') => {
  st.std = scope;
  st.mode = 'local';
  chapterMenu();
  resetFilters();
  choose(id || anchors[scope]);
};
}
