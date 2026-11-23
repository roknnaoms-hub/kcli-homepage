// The Korean homepage groups some topics that have their own English pages.
const homeLanguageLink = document.querySelector('header .language-switch');
const topicPages = {
  'director-greeting': 'institute', 'symbol-philosophy': 'institute', about: 'institute',
  'training-method': 'institute', business: 'institute', 'certification-system': 'institute',
  records: 'institute', iqcs: 'institute', 'iqcs-designation': 'institute', faq: 'institute',
  'management-strategy': 'reading', humanities: 'reading',
  'iso-9001-concession': 'audit-practice', 'iso-9001-performance': 'audit-practice',
  'quality-management': 'audit-practice', 'swot-analysis': 'audit-practice',
  'lean-six-sigma-tools': 'audit-practice', 'ai-management': 'audit-practice', 'iso-19011-guide': 'audit-practice',
  'iso-clauses': 'clauses', 'auditor-registration': 'iqcs-auditor-registration'
};
const homeSections = { 'quality-goals': 'quality-goals', 'learning-hub': 'learning', contact: 'contact', education: 'course-options', approach: 'approach' };
function matchHomepageLanguage() {
  if (document.documentElement.lang === 'en') {
    const korean = new URL('../', location.href);
    if (location.hash === '#quality-goals') korean.hash = 'quality-goals';
    homeLanguageLink.href = korean.href;
    return;
  }
  const destination = new URL('./en/', location.href);
  const course = new URLSearchParams(location.search).get('course');
  if (course) destination.searchParams.set('course', course);
  const current = document.getElementById(location.hash.slice(1));
  const sections = [];
  for (let node = current; node && node.tagName !== 'BODY'; node = node.parentElement) {
    if (node.id) sections.push(node.id);
  }
  const topic = sections.find(id => Object.hasOwn(topicPages, id) || Object.hasOwn(homeSections, id));
  if (topic && topicPages[topic]) {
    destination.pathname += topicPages[topic] + '/';
    const exact = sections.find(id => /^(iso-\d+-clauses|auditor-(process|documents|requirements|fees)|policies|director|training-history|audit-glossary|iso-\d+-visuals)$/.test(id));
    if (topic !== 'auditor-registration' || exact) destination.hash = exact || topic;
  } else if (topic) {
    destination.hash = sections.includes('iso-42001-course') ? 'iso-42001-course' : homeSections[topic];
  }
  homeLanguageLink.href = destination.href;
}
if (homeLanguageLink) {
  matchHomepageLanguage();
  window.addEventListener('hashchange', matchHomepageLanguage);
}

// The Korean course notes have their own page; the English notes live in Audit practice.
const englishHome = document.documentElement.lang === 'en';
const lessonPath = englishHome ? './audit-practice/' : './iso-9001-learning/';
const qualityLessons = [
  { id: 'iso-9001-competence', clause: '7.2', label: englishHome ? '7.2 Competence' : '7.2 역량' },
  { id: 'turtle-diagram', clause: '4.4', label: englishHome ? '4.4 Turtle diagram' : '4.4 터틀 다이어그램' }
];
const learningLinks = document.querySelector(englishHome ? '#learning .iso-path .path-links' : '#learning-hub .iso-path .path-links');
const qualityLinks = document.querySelector('#quality-management .quality-links');
function addQualityLessonLink(container, lesson, className) {
  if (!container) return;
  const link = document.createElement('a');
  link.href = lessonPath + '#' + lesson.id;
  link.textContent = lesson.label;
  if (className) link.className = className;
  container.append(link);
}
const clauseRows = document.querySelectorAll('#iso-9001-clauses tr');
for (const lesson of qualityLessons) {
  addQualityLessonLink(learningLinks, lesson);
  addQualityLessonLink(qualityLinks, lesson, 'auditor-inline-link');
  for (const row of clauseRows) {
    if (row.querySelector('th[scope="row"]')?.textContent.trim() !== lesson.clause) continue;
    const cell = row.querySelector('td');
    if (cell && !cell.querySelector('a')) {
      const link = document.createElement('a');
      link.href = lessonPath + '#' + lesson.id;
      link.textContent = cell.textContent;
      cell.replaceChildren(link);
    }
  }
}
