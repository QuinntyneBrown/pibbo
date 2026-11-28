/* mock.js — tiny runtime for HTML mocks. No framework, no build step.
   - theme: ?theme=light|dark, localStorage, the mock bar toggle, or the `t` key
   - chrome: ?chrome=0 hides the mock bar and notes (used for screenshots)
   - data-state links: elements with [data-set-state] swap data-state on a target
   Everything degrades gracefully when JavaScript is off. */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  function readStored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }

  function currentTheme() {
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') return root.dataset.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) store('mock-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      button.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  var requested = params.get('theme');
  if (requested === 'light' || requested === 'dark') applyTheme(requested, false);
  else if (readStored('mock-theme')) applyTheme(readStored('mock-theme'), false);
  else applyTheme(currentTheme(), false);

  if (params.get('chrome') === '0') root.dataset.chrome = 'off';

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (toggle) { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); return; }
    var chrome = event.target.closest('[data-chrome-toggle]');
    if (chrome) { root.dataset.chrome = root.dataset.chrome === 'off' ? 'on' : 'off'; return; }
    var setter = event.target.closest('[data-set-state]');
    if (setter) {
      var target = document.querySelector(setter.getAttribute('data-target') || 'body');
      if (target) target.dataset.state = setter.getAttribute('data-set-state');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.target.matches('input, textarea, select, [contenteditable]')) return;
    if (event.key === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    if (event.key === 'Escape') {
      var open = document.querySelector('[data-dismiss-on-escape]');
      if (open) open.hidden = true;
    }
  });

  // A feedback state can show either incorrect option selected in the preceding mock.
  var reviewed = document.querySelectorAll('[data-reviewed-choice]');
  var choiceIndex = params.get('choice');
  if (reviewed.length && /^\d+$/.test(choiceIndex) && reviewed[Number(choiceIndex)]) {
    reviewed.forEach(function (option, index) {
      option.setAttribute('aria-pressed', String(index === Number(choiceIndex)));
    });
  }

  // The prototype animates a changed feedback bar and shows the initial frame immediately.
  var bar = document.querySelector('footer.answer-bar');
  var barState = bar && Array.from(bar.classList).find(name => name.startsWith('answer-bar--'));
  var previousBar = params.get('fromBar');
  var navigation = performance.getEntriesByType('navigation')[0];
  if (barState && previousBar && previousBar !== barState &&
      navigation && navigation.type === 'navigate' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    bar.classList.add('answer-bar--entering');
    bar.addEventListener('animationend', function () { bar.classList.remove('answer-bar--entering'); }, { once: true });
  }

  // A game opened from a lesson returns to its path. A catalogue game returns to its group.
  var lesson = params.get('lesson');
  var current = Number(params.get('current'));
  var game = Number(params.get('game'));
  var guided = (lesson === 'read' || lesson === 'count') && Number.isInteger(current) && current >= 1 && current <= 6 &&
    Number.isInteger(game) && game >= 1 && game <= 5;
  var home = params.get('home');
  var fromHome = ['default', 'counting', 'counting-more', 'first-visit'].includes(home);
  var shell = document.querySelector('.shell');

  function pathHref(step) {
    var file = step === 6 ? 'done' : lesson === 'count' ? 'counting' : 'default';
    return '../guided-lesson/' + file + '.html?' + new URLSearchParams({ lesson: lesson, current: step });
  }
  if (shell && (guided || fromHome)) {
    var close = shell.querySelector('[aria-label="Leave game"]');
    var finish = shell.querySelector('.answer-bar--correct a, .answer-bar--right a, .answer-bar--model a, .answer-bar--retry a');
    var group = '../home/' + home + '.html';
    if (close) close.href = guided ? pathHref(current) : group;
    if (finish && finish.textContent.trim() === 'Next') {
      finish.href = guided ? pathHref(game === current ? Math.min(6, current + 1) : current) : group;
    }
    var track = shell.querySelector('.progress');
    if (guided && track) {
      track.setAttribute('aria-valuenow', game);
      track.firstElementChild.className = 'progress__fill progress__fill--' + game;
    }
  }
  document.querySelectorAll('.home a.game-card:not(.game-card--more)').forEach(function (link) {
    var url = new URL(link.href);
    url.searchParams.set('begin', '1');
    url.searchParams.set('home', location.pathname.split('/').pop().replace('.html', ''));
    link.href = url.href;
  });

  // State files stand in for prototype screens. Keep the review settings across them.
  function destination(href) {
    var url = new URL(href, location.href);
    if (new URL('.', url).href === new URL('.', location.href).href) {
      if (barState) url.searchParams.set('fromBar', barState);
      if (shell && guided) {
        url.searchParams.set('lesson', lesson);
        url.searchParams.set('current', current);
        url.searchParams.set('game', game);
      }
      if (shell && fromHome) url.searchParams.set('home', home);
    }
    url.searchParams.set('theme', currentTheme());
    if (root.dataset.chrome === 'off') url.searchParams.set('chrome', '0');
    return url.href;
  }

  document.addEventListener('click', function (event) {
    var choice = event.target.closest('button[data-check-href]');
    if (choice) {
      document.querySelectorAll('[data-check-href]').forEach(function (option) {
        option.setAttribute('aria-pressed', String(option === choice));
      });
      var check = document.querySelector('[data-check-action]');
      if (check.tagName === 'A') check.href = choice.dataset.checkHref;
      else {
        check.disabled = false;
        check.dataset.mockHref = choice.dataset.checkHref;
      }
      return;
    }
    var button = event.target.closest('button[data-mock-href]');
    if (button) {
      location.assign(destination(button.dataset.mockHref));
      return;
    }
    var link = event.target.closest('a[href]');
    if (link && /\.html$/.test(new URL(link.href).pathname) && !link.getAttribute('href').startsWith('#')) {
      link.href = destination(link.href);
    }
  });
})();
