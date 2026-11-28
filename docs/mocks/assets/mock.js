/* mock.js — tiny runtime for HTML mocks. No framework, no build step.
   - theme: ?theme=light|dark, localStorage, the mock bar toggle, or the `t` key
   - chrome: ?chrome=0 hides the mock bar and notes (used for screenshots)
   - data-state links: elements with [data-set-state] swap data-state on a target
   Everything degrades gracefully when JavaScript is off. */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  var skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.querySelector(skip.hash).focus();
    });
  }

  var replay = document.querySelector('.bubble .hear');
  if (replay) {
    var bubble = replay.closest('.bubble');
    var replayTimer;
    function clearReplayCue() {
      clearTimeout(replayTimer);
      bubble.classList.remove('bubble--replaying');
    }
    replay.addEventListener('click', function () {
      clearTimeout(replayTimer);
      bubble.classList.add('bubble--replaying');
      replayTimer = setTimeout(clearReplayCue, 900);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearReplayCue();
    });
    window.addEventListener('pagehide', clearReplayCue);
  }

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }

  function currentTheme() {
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') return root.dataset.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      store('mock-theme', theme);
      var url = new URL(location.href);
      url.searchParams.set('theme', theme);
      history.replaceState(history.state, '', url);
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      button.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  var themeButton = document.querySelector('[data-theme-toggle]');
  if (themeButton) {
    themeButton.setAttribute('aria-keyshortcuts', 'T');
    themeButton.title = 'Switch theme (T while using the review toolbar)';
  }
  var systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function syncTheme() {
    applyTheme(preferredMockTheme(), false);
  }
  syncTheme();
  systemTheme.addEventListener('change', syncTheme);

  var previewButton = document.querySelector('[data-chrome-toggle]');
  var returningFromPreview = false;
  function syncPreview(restoreFocus) {
    var hidden = new URLSearchParams(location.search).get('chrome') === '0';
    root.dataset.chrome = hidden ? 'off' : 'on';
    if (hidden && restoreFocus) {
      document.activeElement.blur();
      window.scrollTo(0, 0);
    } else if (restoreFocus && previewButton) {
      previewButton.focus();
    }
  }
  function showPreview() {
    var url = new URL(location.href);
    url.searchParams.set('chrome', '0');
    history.pushState({ mockPreview: true }, '', url);
    syncPreview(true);
  }
  function exitPreview() {
    if (history.state && history.state.mockPreview) {
      if (returningFromPreview) return;
      returningFromPreview = true;
      history.back();
    } else {
      var url = new URL(location.href);
      url.searchParams.delete('chrome');
      history.replaceState(history.state, '', url);
      syncPreview(true);
    }
  }
  syncPreview(false);
  window.addEventListener('popstate', function () {
    returningFromPreview = false;
    syncTheme();
    var wasHidden = root.dataset.chrome === 'off';
    var hidden = new URLSearchParams(location.search).get('chrome') === '0';
    if (wasHidden !== hidden) syncPreview(true);
  });
  if (previewButton) previewButton.title = 'Hide review controls. Press Escape or use browser Back to return.';

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (toggle) { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); return; }
    var chrome = event.target.closest('[data-chrome-toggle]');
    if (chrome) { showPreview(); return; }
    var setter = event.target.closest('[data-set-state]');
    if (setter) {
      var target = document.querySelector(setter.getAttribute('data-target') || 'body');
      if (target) target.dataset.state = setter.getAttribute('data-set-state');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.target.matches('input, textarea, select, [contenteditable]')) return;
    if (event.key === 't' && !event.repeat && !event.isComposing && !event.metaKey && !event.ctrlKey && !event.altKey && event.target.closest('.mock-bar')) applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    if (event.key === 'Escape') {
      var open = document.querySelector('[data-dismiss-on-escape]:not([hidden])');
      if (open) open.hidden = true;
      else if (root.dataset.chrome === 'off' && window === window.top) exitPreview();
    }
  });

  if (params.get('focusReview') === 'state') {
    var statePill = document.querySelector('.mock-bar__states [aria-current="page"]');
    if (statePill) statePill.focus();
    var reviewUrl = new URL(location.href);
    reviewUrl.searchParams.delete('focusReview');
    history.replaceState(history.state, '', reviewUrl);
  }

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
    if (close) {
      close.href = guided ? pathHref(current) : group;
      close.addEventListener('click', function (event) {
        if (event.detail !== 0) return;
        var url = new URL(close.href);
        if (guided) url.searchParams.set('focusGame', game);
        else url.searchParams.set('homeFocus', location.pathname.split('/').at(-2));
        close.href = url.href;
      });
    }
    if (finish && finish.textContent.trim() === 'Next') {
      var finishDestination = guided ? pathHref(game === current ? Math.min(6, current + 1) : current) : group;
      finish.href = finishDestination;
      finish.addEventListener('click', function (event) {
        var url = new URL(finishDestination, location.href);
        if (event.detail === 0) {
          if (guided) url.searchParams.set('focus', 'lessonAction');
          else url.searchParams.set('homeFocus', location.pathname.split('/').at(-2));
        }
        finish.href = url.href;
      });
    }
    var track = shell.querySelector('.progress');
    if (guided && track) {
      track.setAttribute('aria-valuenow', game);
      track.setAttribute('aria-label', 'Guided lesson, game ' + game + ' of 5');
      track.firstElementChild.className = 'progress__fill progress__fill--' + game;
    }
  }
  document.querySelectorAll('.home a.game-card:not(.game-card--more)').forEach(function (link) {
    var url = new URL(link.href);
    url.searchParams.set('begin', '1');
    url.searchParams.set('home', location.pathname.split('/').pop().replace('.html', ''));
    link.href = url.href;
  });

  var homeFocus = params.get('homeFocus');
  if (homeFocus && document.querySelector('.home')) {
    var target = homeFocus === 'subject' ? '.switch--groups [aria-pressed="true"]'
      : homeFocus === 'games' ? '.game-group__grid a' : null;
    var focusTarget = target ? document.querySelector(target) : Array.from(document.querySelectorAll('.game-card')).find(function (card) {
      return new URL(card.href).pathname.split('/').at(-2) === homeFocus;
    });
    if (focusTarget) {
      focusTarget.focus();
      var cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete('homeFocus');
      history.replaceState(history.state, '', cleanUrl);
    }
  }

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
      var targetUrl = new URL(destination(button.dataset.mockHref));
      if (event.detail === 0 && button.closest('.switch--groups')) targetUrl.searchParams.set('homeFocus', 'subject');
      location.assign(targetUrl.href);
      return;
    }
    var link = event.target.closest('a[href]');
    if (link && /\.html$/.test(new URL(link.href).pathname) && !link.getAttribute('href').startsWith('#')) {
      var linkUrl = new URL(destination(link.href));
      if (event.isTrusted && event.detail === 0 && link.closest('.mock-bar__states')) linkUrl.searchParams.set('focusReview', 'state');
      if (event.detail === 0 && link.matches('.game-card--more')) linkUrl.searchParams.set('homeFocus', 'games');
      link.href = linkUrl.href;
    }
  });
})();
