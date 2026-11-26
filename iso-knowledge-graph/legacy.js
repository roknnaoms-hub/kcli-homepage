const next = new URL('../', location.href);
next.searchParams.set('view', 'terms');
if (document.documentElement.lang === 'en' || new URLSearchParams(location.search).get('standard') === '14001') {
  next.searchParams.set('standard', '14001');
}
location.replace(next.href);
