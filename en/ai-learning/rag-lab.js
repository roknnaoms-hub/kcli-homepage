(() => {
  const lab = document.getElementById('llm-rag-lab');
  if (!lab) return;

  const history = lab.querySelector('#llm-history');
  const topK = lab.querySelector('#llm-top-k');
  const body = lab.querySelector('tbody');
  const result = lab.querySelector('#llm-lab-result');
  const query = lab.dataset.queryVector.split(',').map(Number);
  const queryLength = Math.hypot(...query);
  const documents = Array.from(body.rows, (row) => {
    const vector = row.dataset.vector.split(',').map(Number);
    const dotProduct = query.reduce((sum, component, index) => sum + component * vector[index], 0);
    const score = dotProduct / (queryLength * Math.hypot(...vector));
    row.querySelector('.llm-score').textContent = score.toFixed(3);
    return { row, score, current: row.dataset.edition === 'current' };
  }).sort((first, second) => second.score - first.score);
  const current = documents.filter((doc) => doc.current);
  const archived = documents.filter((doc) => !doc.current);

  function updateRanking() {
    const eligible = history.checked ? documents : current;
    const order = history.checked ? documents : [...current, ...archived];
    const selected = eligible.slice(0, Number(topK.value));

    for (const doc of order) {
      const rank = selected.indexOf(doc) + 1;
      const filtered = !history.checked && !doc.current;
      let label = 'Outside top results';
      if (rank) label = `Rank ${rank}`;
      if (filtered) label = 'Excluded by edition filter';
      doc.row.querySelector('.llm-rank').textContent = label;
      doc.row.toggleAttribute('data-ranked', rank > 0);
      doc.row.toggleAttribute('data-filtered', filtered);
      body.append(doc.row);
    }

    const evidence = selected.find((doc) => doc.row.hasAttribute('data-current-evidence'));
    if (!evidence) {
      result.textContent = 'Only a superseded edition was retrieved. The answer is withheld until a current source is available.';
      return;
    }

    const sourceStatus = selected[0].current
      ? 'The current guide ranks first.'
      : `The superseded guide ranks first. The current guide ranks ${selected.indexOf(evidence) + 1}.`;
    result.textContent = `${sourceStatus} The operations coordinator reviews the report. See Exercise Operations Guide v2, page 3.`;
  }

  updateRanking();
  history.addEventListener('change', updateRanking);
  topK.addEventListener('change', updateRanking);
  lab.querySelector('.llm-lab-controls').hidden = false;
})();
