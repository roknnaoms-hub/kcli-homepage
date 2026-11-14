(() => {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const fontFamily = 'Pretendard, "Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const copyright = 'Copyright © ISO · IQCS · KCLI';
  const width = 1200;
  const margin = 36;
  const columnGap = 20;
  const columnWidth = (width - 2 * margin - columnGap) / 2;
  const numberWidth = 100;
  const bodyTop = 184;
  const columnHeadingHeight = 34;
  const chapterHeadingHeight = 36;
  const chapterGap = 12;
  const labelSize = 17;
  const labelLineHeight = 22;
  const noteSize = 14;
  const noteLineHeight = 19;
  const ink = '#102a43';
  const blue = '#0b3564';
  const muted = '#526577';

  function addSvg(parent, tag, attributes, content) {
    const element = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    if (content !== undefined) element.textContent = content;
    parent.append(element);
    return element;
  }

  function addText(parent, x, y, content, attributes = {}) {
    return addSvg(parent, 'text', { x, y, ...attributes }, content);
  }

  function wrapLines(context, value, lineWidth, fontSize) {
    if (!value) return [];
    context.font = `${fontSize}px ${fontFamily}`;
    const lines = [];
    let line = '';
    for (const word of value.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > lineWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    return [...lines, line];
  }

  function readChapters(card, context) {
    const chapters = [];
    for (const item of card.querySelectorAll('.iso-chapters > li')) {
      const heading = item.querySelector('.iso-chapter-title');
      const number = heading?.querySelector('.iso-clause-number')?.textContent.trim();
      if (!/^(?:[4-9]|10)$/.test(number)) continue;

      const name = heading.textContent.trim().slice(number.length).trim();
      const rows = Array.from(item.querySelectorAll('tbody tr'), (row) => {
        const clause = row.cells[0].textContent.trim();
        const label = row.cells[1].cloneNode(true);
        const note = label.querySelector('.iso-clause-note');
        note?.remove();
        const indent = (clause.split('.').length - 2) * 12;
        const lineWidth = columnWidth - numberWidth - indent - 14;
        const labels = wrapLines(context, label.textContent.trim(), lineWidth, labelSize);
        const notes = wrapLines(context, note?.textContent.trim(), lineWidth, noteSize);
        const height = 10 + labelLineHeight * labels.length + noteLineHeight * notes.length;
        return { clause, indent, labels, notes, height };
      });
      const height = chapterHeadingHeight + rows.reduce((sum, row) => sum + row.height, 0);
      chapters.push({ number, name, rows, height });
    }
    return chapters;
  }

  function renderColumn(svg, chapters, x) {
    addSvg(svg, 'rect', { x, y: bodyTop, width: columnWidth, height: columnHeadingHeight, rx: 4, fill: blue });
    addText(svg, x + 14, bodyTop + 23, '조항 번호', { fill: '#fff', 'font-size': 15, 'font-weight': 700 });
    addText(svg, x + numberWidth, bodyTop + 23, '교육용 국문 항목명', { fill: '#fff', 'font-size': 15, 'font-weight': 700 });

    let y = bodyTop + columnHeadingHeight + 8;
    for (const chapter of chapters) {
      const group = addSvg(svg, 'g', { 'data-chapter': chapter.number });
      addSvg(group, 'rect', { x, y, width: columnWidth, height: chapterHeadingHeight, fill: '#dce9f4' });
      addSvg(group, 'rect', { x, y, width: 4, height: chapterHeadingHeight, fill: blue });
      addText(group, x + 14, y + 24, chapter.number, { fill: blue, 'font-size': 18, 'font-weight': 700 });
      addText(group, x + numberWidth, y + 24, chapter.name, { 'font-size': 18, 'font-weight': 700 });
      y += chapterHeadingHeight;

      chapter.rows.forEach((row, index) => {
        const clause = addSvg(group, 'g', { 'data-clause': row.clause });
        addSvg(clause, 'rect', { x, y, width: columnWidth, height: row.height, fill: index % 2 ? '#f1f5f9' : '#fff' });
        addText(clause, x + 14, y + 22, row.clause, { fill: blue, 'font-size': 16, 'font-weight': 600 });
        const labelX = x + numberWidth + row.indent;
        row.labels.forEach((line, index) => {
          addText(clause, labelX, y + 22 + labelLineHeight * index, line, { 'font-size': labelSize });
        });
        row.notes.forEach((line, index) => {
          addText(clause, labelX, y + 18 + labelLineHeight * row.labels.length + noteLineHeight * index, line,
            { fill: muted, 'font-size': noteSize });
        });
        y += row.height;
      });
      y += chapterGap;
    }
  }

  function createDatasheet(card, standard, amendment) {
    const context = document.createElement('canvas').getContext('2d');
    const chapters = readChapters(card, context);
    const totalHeight = chapters.reduce((sum, chapter) => sum + chapter.height + chapterGap, 0);
    let leftHeight = 0;
    let split = 0;
    for (const chapter of chapters) {
      const nextHeight = leftHeight + chapter.height + chapterGap;
      if (Math.abs(totalHeight - 2 * nextHeight) > Math.abs(totalHeight - 2 * leftHeight)) break;
      leftHeight = nextHeight;
      split += 1;
    }
    const columns = [chapters.slice(0, split), chapters.slice(split)];
    const footerTop = bodyTop + columnHeadingHeight + 24 + Math.max(leftHeight, totalHeight - leftHeight);
    const height = footerTop + 58;
    const subtitle = card.querySelector('.iso-index-subtitle').textContent.trim();
    const edition = amendment ? `${standard} · ${amendment}` : standard;
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', 'sheet-title sheet-description');
    svg.setAttribute('lang', 'ko');
    svg.setAttribute('font-family', fontFamily);
    svg.setAttribute('fill', ink);
    addSvg(svg, 'title', { id: 'sheet-title' }, `${edition} 요구사항 4~10항 데이터시트`);
    addSvg(svg, 'desc', { id: 'sheet-description' }, `${subtitle}의 조항 번호와 KCLI 교육용 국문 항목명. ${copyright}`);
    addSvg(svg, 'rect', { width, height, fill: '#f5f8fb' });
    addSvg(svg, 'rect', { width, height: 158, fill: '#071d38' });
    addSvg(svg, 'rect', { x: margin, y: 27, width: 4, height: 102, fill: '#f1c75b' });
    addText(svg, margin + 20, 45, 'KCLI 연수교육 · ISO 요구사항 데이터시트', { fill: '#d9e8f5', 'font-size': 17, 'font-weight': 600 });
    addText(svg, margin + 20, 90, edition, { fill: '#fff', 'font-size': 38, 'font-weight': 800 });
    addText(svg, margin + 20, 124, subtitle, { fill: '#fff', 'font-size': 21, 'font-weight': 600 });
    addSvg(svg, 'rect', { x: width - margin - 100, y: 50, width: 100, height: 40, rx: 6, fill: '#f1c75b' });
    addText(svg, width - margin - 50, 76, '4~10항', { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700 });

    columns.forEach((column, index) => renderColumn(svg, column, margin + index * (columnWidth + columnGap)));
    addSvg(svg, 'line', { x1: margin, x2: width - margin, y1: footerTop, y2: footerTop, stroke: '#b9ccdb' });
    const source = addSvg(svg, 'a', { href: card.querySelector('.iso-index-source').href });
    addText(source, margin, footerTop + 34, 'ISO 공식 발행 정보 ↗', { fill: blue, 'font-size': 15, 'text-decoration': 'underline' });
    addText(svg, width - margin, footerTop + 34, copyright, { fill: ink, 'font-size': 15, 'font-weight': 600, 'text-anchor': 'end' });
    return svg;
  }

  for (const card of document.querySelectorAll('.iso-index-grid > .iso-index-standard')) {
    const standard = card.querySelector('h3').textContent.trim();
    const amendment = card.querySelector('.iso-index-meta').textContent.match(/Amd \d+:\d{4}/)?.[0];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'iso-datasheet-button';
    button.textContent = '4~10항 SVG 저장 ↓';
    button.setAttribute('aria-label', `${standard} 4~10항 SVG 저장`);
    card.querySelector('.iso-chapters').before(button);
    button.addEventListener('click', () => {
      const svg = createDatasheet(card, standard, amendment);
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const edition = [standard, amendment].filter(Boolean).join(' ');
      const filename = edition.replace(/[^a-z0-9]+/gi, '_');
      const link = document.createElement('a');
      link.download = `KCLI_${filename}_Clauses_4-10.svg`;
      link.href = url;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    });
  }
})();
