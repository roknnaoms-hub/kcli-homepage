const koreanLink = document.querySelector('.language-switch');
function updateKoreanSection() {
  const id = location.hash.slice(1);
  const section = id && document.getElementById(id)?.closest('section[id]');
  koreanLink.href = '../../#' + (section ? id : 'quality-management');
}
updateKoreanSection();
window.addEventListener('hashchange', updateKoreanSection);
