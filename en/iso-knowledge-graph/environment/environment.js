'use strict';
export const verbs = {
  addresses:'addresses recurrence of', bounds:'defines the boundary of', canBecome:'can become', canChange:'can cause',
  checkedFor:'is checked for', checks:'checks fulfilment of', conducts:'conducts', dataFor:'provides data on',
  describes:'describes the state of', enhances:'enhances', establishes:'establishes', evidences:'provides evidence of',
  focusesOn:'addresses', frames:'provides a framework for', hasReq:'has a requirement represented by',
  includes:'includes', informs:'informs', interactsWith:'interacts with', kindOf:'is a type of', leads:'directs',
  mitigates:'can mitigate', partOf:'is part of', promotes:'promotes', requiresAbility:'requires',
  reviewInput:'provides input to', reviewsSystem:'reviews', setsTest:'provides a criterion for',
  trackedBy:'is tracked using'
};
const text = (tag, value, cls) => {
  const el = document.createElement(tag);
  el.textContent = value;
  if (cls) el.className = cls;
  return el;
};
export function mountTerms(root, {terms, edges}) {
  const byId = id => root.getElementById(id);
  const usage=new Map(Object.entries(terms));
  const label=(id,lang='en')=>terms[id][lang];
  const ordered = [...usage.keys()].sort((a,b)=>label(a).localeCompare(label(b),'en'));
  const sel = byId('terms'), query=byId('query');
  let current = 'ems', page = 0;
  byId('summary').textContent = usage.size+' terms and '+edges.length+' directed relationships, including all '+[...usage.values()].filter(u=>u.term).length+' definitions in Clause 3.';
  function jump(id){
    current=id;page=0;query.value='';fill();render();
  }
  function fill(){
    const value=query.value.trim().toLowerCase();
    const ids=ordered.filter(id=>{
      const u=usage.get(id);
      if(/^\d+(\.\d+)*\.?$/.test(value))return [u.term,...u.clauses].some(c=>c===value||c.startsWith(value.replace(/\.$/,'')+'.'));
      return [label(id),label(id,'ko'),u.aliases].some(v=>v.toLowerCase().includes(value));
    });
    sel.replaceChildren(...ids.map(id=>new Option(label(id),id)));
    if(!ids.includes(current))current=ids[0];
    if(current)sel.value=current;
    sel.disabled=!current;byId('content').hidden=!current;
    byId('status').textContent=value?(ids.length?ids.length+' matching terms.':'No matching terms. Try another term or clause number.'):'';
  }
  function render(){
    if(!current)return;
    const u=usage.get(current), cl=u.term;
    byId('clause').textContent=cl?'Definition '+cl:'Application term';
    byId('title').textContent=label(current);byId('ko').textContent=label(current,'ko');
    byId('desc').textContent=u.desc;
    byId('related').textContent='Related clauses · '+u.clauses.join(', ');
    byId('refs').textContent=u.refs;
    const map=byId('map'),list=byId('links');
    map.replaceChildren(text('strong',label(current),'root'));list.replaceChildren();
    const connections=edges.filter(e=>[e.s,e.t].includes(current));
    connections.forEach((e,i)=>{
      const s=e.s,t=e.t,out=s===current,id=out?t:s,verb=verbs[e.k];
      function node(){const b=text('button',label(id));b.type='button';b.onclick=()=>jump(id);return b;}
      if(Math.floor(i/5)===page){
        const row=text('div','','branch');
        const line=label(s)+' → '+verb+' → '+label(t);
        row.append(text('span',out?'→ '+verb: '← '+verb),node());row.title=line;map.append(row);
      }
      const li=text('li','');
      if(out)li.append(label(s)+' → '+verb+' → ',node());else li.append(node(),' → '+verb+' → '+label(t));
      li.append(text('small',e.refs));list.append(li);
    });
    byId('range').textContent=(page*5+1)+'–'+Math.min(page*5+5,connections.length)+' of '+connections.length;
    byId('prev').disabled=page===0;byId('next').disabled=(page+1)*5>=connections.length;
  }
  query.oninput=()=>{page=0;fill();render();};
  sel.onchange=()=>{current=sel.value;page=0;render();};
  byId('next').onclick=()=>{page++;render();};byId('prev').onclick=()=>{page--;render();};
  fill();render();
  return (id) => jump(usage.has(id) ? id : 'ems');
}
