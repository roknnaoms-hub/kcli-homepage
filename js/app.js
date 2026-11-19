document.documentElement.classList.add('js');

// Leave domain-forwarding frames before opening the cookie-based LMS.
document.querySelectorAll('a[href]').forEach((link) => {
  const url = new URL(link.href, location.href);
  if (url.origin === 'https://kcli-iso19011-records.roknaoms.chatgpt.site') {
    link.target = '_top';
  }
});

const forwardedHosts = new Set(['kcli.ai.kr', 'www.kcli.ai.kr']);
const framed = window.self !== window.top;
const insecureAlias = location.protocol === 'http:' && forwardedHosts.has(location.hostname);
if (framed || insecureAlias) {
  const english = document.documentElement.lang.startsWith('en');
  const officialHome = 'https://roknnaoms-hub.github.io/kcli-homepage/';
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const destination = new URL(canonical?.startsWith(officialHome) ? canonical : officialHome);
  destination.hash = location.hash;
  const frameHost = document.referrer ? new URL(document.referrer).hostname : '';
  if (insecureAlias) window.location.replace(destination.href);
  else if (forwardedHosts.has(frameHost)) {
    // Some in-app browsers require user activation for top navigation; the links below also work there.
    try { window.top.location.href = destination.href; } catch {}
  }
  const notice = document.createElement('aside');
  notice.setAttribute('aria-label', english ? 'Secure access' : '보안 접속 안내');
  Object.assign(notice.style, {
    position: 'relative', zIndex: '1001', padding: '16px 20px',
    background: '#edf4fa', color: '#102a43', borderBottom: '1px solid #aebdca',
    fontFamily: 'sans-serif', lineHeight: '1.6', textAlign: 'center'
  });
  const message = document.createElement('p');
  message.textContent = english
    ? 'Open KCLI directly over HTTPS to use the classroom and sign in securely.'
    : '도메인 연결 화면 안에서 접속하셨습니다. 안전한 로그인과 수강을 위해 HTTPS 화면을 직접 열어 주세요.';
  message.style.margin = '0 0 8px';
  notice.append(message);
  [
    [destination.href, english ? 'Open secure KCLI website' : '보안 홈페이지 열기'],
    ['https://kcli-iso19011-records.roknaoms.chatgpt.site/classroom', english ? 'Student sign in' : '수강생 로그인']
  ].forEach(([href, label]) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_top';
    link.textContent = label;
    Object.assign(link.style, {
      display: 'inline-block', margin: '4px 8px', padding: '8px 14px',
      background: '#0b3564', color: '#fff', borderRadius: '6px', fontWeight: '700'
    });
    notice.append(link);
  });
  document.body.prepend(notice);
}

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-button');
const menuLabel = menuButton?.querySelector('.sr-only');
const menuOpenLabel = menuLabel?.textContent;
const strategyMenu = header?.querySelector('.strategy-menu');

if (strategyMenu) {
  document.addEventListener('click', (event) => {
    if (!strategyMenu.contains(event.target)) strategyMenu.open = false;
  });
  strategyMenu.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !strategyMenu.contains(event.relatedTarget)) strategyMenu.open = false;
  });
}

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  if (menuLabel) menuLabel.textContent = open ? (menuButton.dataset.closeLabel || '메뉴 닫기') : menuOpenLabel;
});

document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  if (strategyMenu) strategyMenu.open = false;
  header?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuLabel) menuLabel.textContent = menuOpenLabel;
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
  if (event.key === 'Escape' && strategyMenu?.open) {
    strategyMenu.open = false;
    strategyMenu.querySelector('summary').focus();
    return;
  }
  if (event.key === 'Escape' && header?.classList.contains('open')) {
    header.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = menuOpenLabel;
    menuButton.focus();
  }
});
const inquiryType = document.getElementById('inquiry-type');
const inquiryMail = document.getElementById('inquiry-mail');
if (inquiryType) {
  const selectedCourse = new URLSearchParams(location.search).get('course');
  if (Array.from(inquiryType.options).some((option) => option.dataset.standard && option.value === selectedCourse)) {
    inquiryType.value = selectedCourse;
  }
}
const inquiryPrompts = {
  organization: ['기업·기관 교육 협력 문의', '기관명: \n희망 교육 주제: \n참여 대상·인원: \n희망 일정·방식: \n기대 결과: '],
  knowledge: ['AI·지식정보 분야 협력 문의', '기관명: \n협력 주제: \n현재 업무 현안: \n희망 일정: \n문의사항: ']
};
function updateInquiry() {
  if (!inquiryType || !inquiryMail) return;
  const standard = inquiryType.selectedOptions[0]?.dataset.standard;
  const [subject, body] = inquiryPrompts[inquiryType.value] ?? [
    `${standard ?? 'ISO 심사원'} 교육 문의`,
    `관심 규격: ${standard ?? ''}\n현재 업무 또는 경력: \n희망 일정: \n문의사항: `
  ];
  inquiryMail.href = 'mailto:roknaoms@naver.com?subject=' + encodeURIComponent('[KCLI] ' + subject) + '&body=' + encodeURIComponent(body);
}
inquiryType?.addEventListener('change', updateInquiry);
document.querySelectorAll('a[data-course]').forEach((link) => {
  link.addEventListener('click', () => {
    if (!inquiryType) return;
    inquiryType.value = link.dataset.course;
    updateInquiry();
  });
});
updateInquiry();

const textbookPreview = document.getElementById('textbook-preview');
if (textbookPreview) {
  const title = textbookPreview.querySelector('h2');
  const media = textbookPreview.querySelector('.textbook-preview-media');
  document.querySelectorAll('button[aria-controls="textbook-preview"]').forEach((button) => {
    button.addEventListener('click', () => {
      const heading = button.closest('figure, .iso-index-standard').querySelector('h3, h4').textContent;
      const thumbnail = button.querySelector('img');
      const image = new Image();
      image.src = thumbnail?.src ?? button.dataset.previewSrc;
      image.alt = thumbnail?.alt ?? `${heading} 4~10항 도표`;
      image.draggable = false;
      title.textContent = heading;
      media.replaceChildren(image);
      textbookPreview.showModal();
    });
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  });
  media.addEventListener('contextmenu', (event) => event.preventDefault());
}

const copyEmail = document.getElementById('copy-email');
if (copyEmail) {
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    const status = document.getElementById('inquiry-status');
    try {
      await navigator.clipboard.writeText('roknaoms@naver.com');
      status.textContent = '이메일 주소를 복사했습니다: roknaoms@naver.com';
    } catch {
      status.textContent = '자동 복사를 사용할 수 없습니다. 주소를 직접 복사해 주세요: roknaoms@naver.com';
    }
  });
}
