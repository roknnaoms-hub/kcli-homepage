// Both collections keep their own source IDs. Explicit correspondences also
// distinguish the environmental impact node from the AI impact assessment.
const equivalents = {
  findings: 'finding', program: 'programme', conf: 'conform', fix: 'correction',
  proc: 'process', aisys: 'ai', impact: 'aia', eimpact: 'impact'
};
const standards = {q: 's9001', e: 's14001', u: 's19011', i: 's42001'};

export function integrateTerms(model, data, verbs) {
  const english = Boolean(data.terms);
  const terms = english ? Object.entries(data.terms).map(([id, term]) => ({id, ...term})) : data.nodes;
  const ids = new Map();
  for (const term of terms) {
    const id = equivalents[term.id] || term.id;
    ids.set(term.id, id);
    const uses = english ? [{std: 'e', ...term}] : term.uses;
    const refs = uses.map(use => standards[use.std]);
    const node = model.nodes[id] ||= {
      id, kind: 'Term', label: english ? term.en : term.ko, en: term.en,
      desc: english ? term.desc : uses[0].meaning, refs
    };
    node.termId = term.id;
    node.refs = [...new Set([...node.refs, ...refs])];
    node.keywords = [term.ko, term.en, term.aliases, ...uses.flatMap(use =>
      [model.nodes[standards[use.std]].label, use.englishLabel, use.term, ...use.clauses]
    )].filter(Boolean).join(' ');
  }

  const predicates = english ? verbs : data.pred;
  const source = english ? 'Term relationships in KCLI training materials' : 'KCLI 교재의 용어 관계';
  model.basis.training = source;
  for (const edge of data.edges) {
    const p = 'term-' + edge.k;
    model.types[p] ||= [predicates[edge.k], 'Term', 'Term', source];
    model.edges.push({s: ids.get(edge.s), p, o: ids.get(edge.t), basis: 'training'});
  }
}

export function attachTermView(template, host) {
  const root = host.attachShadow({mode: 'open'});
  root.append(template.content.cloneNode(true));
  return root;
}
