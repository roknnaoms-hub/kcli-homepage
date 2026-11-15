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
      let label = '상위 범위 밖';
      if (rank) label = `${rank}위`;
      if (filtered) label = '개정판 필터 제외';
      doc.row.querySelector('.llm-rank').textContent = label;
      doc.row.toggleAttribute('data-ranked', rank > 0);
      doc.row.toggleAttribute('data-filtered', filtered);
      body.append(doc.row);
    }

    const evidence = selected.find((doc) => doc.row.hasAttribute('data-current-evidence'));
    if (!evidence) {
      result.textContent = '이전 판만 검색됐습니다. 현행 근거가 확보될 때까지 답변을 보류합니다.';
      return;
    }

    const sourceStatus = selected[0].current
      ? '현행 안내가 1위입니다.'
      : `이전 판이 1위이고 현행 안내는 ${selected.indexOf(evidence) + 1}위입니다.`;
    result.textContent = `${sourceStatus} 운영 담당자가 보고서를 검토합니다. 근거는 실습 운영 안내 v2, 3쪽입니다.`;
  }

  updateRanking();
  history.addEventListener('change', updateRanking);
  topK.addEventListener('change', updateRanking);
  lab.querySelector('.llm-lab-controls').hidden = false;
})();
