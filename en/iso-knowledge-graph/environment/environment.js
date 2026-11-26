'use strict';
const byId = id => document.getElementById(id);
const verbs = {
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
async function start(){
  const res = await fetch('../../../iso-knowledge-graph/terms/KCLI_ISO_Ontology.jsonld');
  if (!res.ok) throw new Error('Ontology unavailable');
  const records = (await res.json())['@graph'];
  const all = new Map(records.map(r=>[r['@id'],r]));
  const usage = new Map(records.filter(r=>r['@id'].startsWith('k:usage:e:')).map(r=>['term:'+r['@id'].split(':').pop(),r]));
  const edges = records.filter(r=>r['@type']==='rdf:Statement' && r['k:interpretation'].some(v=>v['k:standard']['@id']==='k:standard:e'));
  function label(id,lang='en'){
    const value=(lang==='en' && usage.get(id)['k:englishLabel']?.['@value']) || all.get(id)['skos:prefLabel'].find(v=>v['@language']===lang)['@value'];
    return lang==='en'?value[0].toUpperCase()+value.slice(1):value;
  }
  const ordered = [...usage.keys()].sort((a,b)=>label(a).localeCompare(label(b),'en'));
  const sel = byId('terms'), query=byId('query');
  let current = 'term:ems', page = 0;
  byId('summary').textContent = usage.size+' terms and '+edges.length+' directed relationships, including all '+[...usage.values()].filter(u=>u['k:definitionClause']).length+' definitions in Clause 3.';
  function refs(items){
    const groups = new Map();
    for(const ref of items){
      const r=all.get(ref['@id']), book=r['dct:isPartOf']['@id'];
      if(!['k:book:E','k:book:EF'].includes(book))continue;
      if(!groups.has(book))groups.set(book,new Set());
      groups.get(book).add(r['k:page']);
    }
    return [...groups].map(([book,pages])=>(book==='k:book:E'?'KCLI training slides ':'ISO 14001:2026 PDF pages ')+[...pages].sort((a,b)=>a-b).join(', ')).join(' · ');
  }
  function jump(id){
    current=id;page=0;query.value='';fill();render();
  }
  function fill(){
    const value=query.value.trim().toLowerCase();
    const ids=ordered.filter(id=>{
      const u=usage.get(id);
      if(/^\d+(\.\d+)*\.?$/.test(value))return [u['k:definitionClause'],...u['k:relatedClause']].some(c=>c===value||c.startsWith(value.replace(/\.$/,'')+'.'));
      return [label(id),label(id,'ko'),all.get(id)['k:searchTerms']].some(v=>v.toLowerCase().includes(value));
    });
    sel.replaceChildren(...ids.map(id=>new Option(label(id),id)));
    if(!ids.includes(current))current=ids[0];
    if(current)sel.value=current;
    sel.disabled=!current;byId('content').hidden=!current;
    byId('status').textContent=value?(ids.length?ids.length+' matching terms.':'No matching terms. Try another term or clause number.'):'';
  }
  function render(){
    if(!current)return;
    const u=usage.get(current), cl=u['k:definitionClause'];
    byId('clause').textContent=cl?'Definition '+cl:'Application term';
    byId('title').textContent=label(current);byId('ko').textContent=label(current,'ko');
    byId('desc').textContent=u['k:englishNote']['@value'];
    byId('related').textContent='Related clauses · '+u['k:relatedClause'].join(', ');
    byId('refs').textContent=refs(u['prov:wasDerivedFrom']);
    const map=byId('map'),list=byId('links');
    map.replaceChildren(text('strong',label(current),'root'));list.replaceChildren();
    const connections=edges.filter(e=>[e['rdf:subject']['@id'],e['rdf:object']['@id']].includes(current));
    connections.forEach((e,i)=>{
      const s=e['rdf:subject']['@id'],t=e['rdf:object']['@id'],out=s===current,id=out?t:s,verb=verbs[e['rdf:predicate']['@id'].slice(4)];
      function node(){const b=text('button',label(id));b.type='button';b.onclick=()=>jump(id);return b;}
      if(Math.floor(i/5)===page){
        const row=text('div','','branch');
        const line=label(s)+' → '+verb+' → '+label(t);
        row.append(text('span',out?'→ '+verb: '← '+verb),node());row.title=line;map.append(row);
      }
      const li=text('li','');
      if(out)li.append(label(s)+' → '+verb+' → ',node());else li.append(node(),' → '+verb+' → '+label(t));
      li.append(text('small',refs(e['prov:wasDerivedFrom'])));list.append(li);
    });
    byId('range').textContent=(page*5+1)+'–'+Math.min(page*5+5,connections.length)+' of '+connections.length;
    byId('prev').disabled=page===0;byId('next').disabled=(page+1)*5>=connections.length;
  }
  query.oninput=()=>{page=0;fill();render();};
  sel.onchange=()=>{current=sel.value;page=0;render();};
  byId('next').onclick=()=>{page++;render();};byId('prev').onclick=()=>{page--;render();};
  fill();render();
}
start().catch(()=>{byId('status').textContent='The ontology could not be loaded. Reload this page to try again.';});
