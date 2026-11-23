const koreanLink = document.querySelector('.language-switch');
function updateKoreanSection() {
  const id = location.hash.slice(1);
  const section = id && document.getElementById(id)?.closest('section[id]');
  if (section && ['iso-9001-competence', 'turtle-diagram'].includes(section.id)) {
    koreanLink.href = '../../iso-9001-learning/#' + section.id;
  } else {
    koreanLink.href = '../../#' + (section ? id : 'quality-management');
  }
}
updateKoreanSection();
window.addEventListener('hashchange', updateKoreanSection);
