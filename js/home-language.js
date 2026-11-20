// The Korean homepage groups some topics that have their own English pages.
const homeLanguageLink = document.querySelector('header .language-switch');
const topicPages = {
  'director-greeting': 'institute', 'symbol-philosophy': 'institute', about: 'institute',
  'training-method': 'institute', business: 'institute', 'certification-system': 'institute',
  records: 'institute', iqcs: 'institute', 'iqcs-designation': 'institute', faq: 'institute',
  'management-strategy': 'reading', humanities: 'reading',
  'quality-management': 'audit-practice', 'swot-analysis': 'audit-practice',
  'lean-six-sigma-tools': 'audit-practice', 'ai-management': 'audit-practice', 'iso-19011-guide': 'audit-practice',
  'iso-clauses': 'clauses', 'auditor-registration': 'iqcs-auditor-registration'
};
const homeSections = { 'learning-hub': 'learning', contact: 'contact', education: 'course-options', approach: 'approach' };
function matchEnglishTopic() {
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
  matchEnglishTopic();
  window.addEventListener('hashchange', matchEnglishTopic);
}
