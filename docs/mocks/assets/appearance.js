// Resolve the requested appearance before the browser lays out the mock.
function preferredMockTheme() {
  const requested = new URLSearchParams(location.search).get('theme');
  if (requested === 'dark' || requested === 'light') return requested;
  try {
    const stored = localStorage.getItem('mock-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* Storage is optional when reviewing local files. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.documentElement.dataset.theme = preferredMockTheme();
document.documentElement.dataset.chrome = new URLSearchParams(location.search).get('chrome') === '0' ? 'off' : 'on';
