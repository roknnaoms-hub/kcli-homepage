document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-button');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.sr-only').textContent = open ? '메뉴 닫기' : '메뉴 열기';
});

document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  header?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  const label = menuButton?.querySelector('.sr-only');
  if (label) label.textContent = '메뉴 열기';
}));

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('visible'));
}

let hashTarget = null;
try { hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch { /* Ignore malformed URL fragments. */ }
hashTarget?.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
hashTarget?.classList.toggle('visible', hashTarget.classList.contains('reveal'));
document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});


document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && header?.classList.contains('open')) {
    header.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.sr-only').textContent = '메뉴 열기';
    menuButton.focus();
  }
});
const inquiryType = document.getElementById('inquiry-type');
const inquiryMail = document.getElementById('inquiry-mail');
const inquiryPrompts = {
  course: ['ISO 42001 교육 문의', '관심 과정: ISO/IEC 42001 인증심사원 교육\n현재 업무 또는 경력: \n희망 일정: \n문의사항: '],
  organization: ['기업·기관 교육 협력 문의', '기관명: \n희망 교육 주제: \n참여 대상·인원: \n희망 일정·방식: \n기대 결과: '],
  knowledge: ['AI·지식정보 분야 협력 문의', '기관명: \n협력 주제: \n현재 업무 현안: \n희망 일정: \n문의사항: ']
};
function updateInquiry() {
  if (!inquiryType || !inquiryMail) return;
  const [subject, body] = inquiryPrompts[inquiryType.value] || inquiryPrompts.course;
  inquiryMail.href = 'mailto:kcli@k-cli.kr?subject=' + encodeURIComponent('[KCLI] ' + subject) + '&body=' + encodeURIComponent(body);
}
inquiryType?.addEventListener('change', updateInquiry);
updateInquiry();
const copyEmail = document.getElementById('copy-email');
if (copyEmail) {
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    const status = document.getElementById('inquiry-status');
    try {
      await navigator.clipboard.writeText('kcli@k-cli.kr');
      status.textContent = '이메일 주소를 복사했습니다: kcli@k-cli.kr';
    } catch {
      status.textContent = '자동 복사를 사용할 수 없습니다. 주소를 직접 복사해 주세요: kcli@k-cli.kr';
    }
  });
}
