// The playing frame opens on its illustrated beat so it can be inspected in the gallery.
(function () {
  const number = document.querySelector('.dance__number');
  const beats = Array.from(document.querySelectorAll('.chant__beat'));
  const toggle = document.querySelector('.controls > button');
  const speeds = Array.from(document.querySelectorAll('.switch--speed button'));
  const easing = getComputedStyle(number).getPropertyValue('--ease-out-quint').trim();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let beat = Number(number.textContent) || 0;
  let playing = toggle.textContent.trim() === 'Pause';
  const poses = {
    [playing ? 'cheer' : 'rest']: document.querySelector('.dance .pibbo'),
    [playing ? 'pause' : 'play']: toggle.querySelector('svg')
  };
  const preview = new URLSearchParams(location.search);
  const requestedBeat = preview.get('beat');
  const requestedTempo = preview.get('tempo');
  if (requestedTempo === 'fast' || requestedTempo === 'slow') {
    speeds.forEach(speed => speed.setAttribute('aria-checked',
      String(speed.textContent.trim().toLowerCase() === requestedTempo)));
  }
  let timer;
  let pulse;

  function clone(id) {
    const source = poses[id] || document.getElementById('dance-' + id).content.firstElementChild;
    return source.cloneNode(true);
  }

  function setPlaying(value) {
    clearTimeout(timer);
    playing = value;
    document.querySelector('.dance .pibbo').replaceWith(clone(value ? 'cheer' : 'rest'));
    toggle.replaceChildren(clone(value ? 'pause' : 'play'), value ? ' Pause' : beat > 0 && beat < beats.length ? ' Keep dancing' : ' Start the music');
    if (!value) pulse?.cancel();
  }

  function drawBeat() {
    number.textContent = beat || '♪';
    beats.forEach((item, i) => {
      item.classList.toggle('chant__beat--said', i + 1 < beat);
      item.classList.toggle('chant__beat--now', i + 1 === beat);
      if (i + 1 === beat) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    const figure = document.querySelector('.dance .pibbo');
    figure.classList.toggle('dance__pibbo--sway', playing && beat % 2 === 1);
    figure.classList.toggle('dance__pibbo--counter-sway', playing && beat % 2 === 0);
  }

  function schedule() {
    clearTimeout(timer);
    const fast = speeds[1].getAttribute('aria-checked') === 'true';
    timer = setTimeout(advance, fast ? 600 : 900);
  }

  function advance() {
    if (!playing || document.hidden) return;
    if (beat === beats.length) {
      setPlaying(false);
      document.querySelector('.mock-bar a[href="correct.html"]').click();
      return;
    }
    beat++;
    drawBeat();
    if (!reduced.matches) {
      pulse?.cancel();
      pulse = number.animate([{ scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1 }], { duration: 160, easing });
    }
    schedule();
  }

  if (/^(?:[0-9]|10)$/.test(requestedBeat)) {
    beat = Number(requestedBeat);
    setPlaying(playing);
    drawBeat();
  }
  if (preview.has('beat') || preview.has('tempo')) {
    for (const transition of number.closest('.stage').getAnimations({ subtree: true })) {
      if (transition instanceof CSSTransition) transition.finish();
    }
  }
  toggle.addEventListener('click', () => {
    if (!playing && beat === beats.length) beat = 0;
    setPlaying(!playing);
    if (playing) advance();
  });

  function keepTempo(tempo) {
    for (const link of document.querySelectorAll('.mock-bar__states a')) {
      const url = new URL(link.href);
      if (url.pathname.endsWith('/correct.html')) continue;
      url.searchParams.set('tempo', tempo);
      link.href = url.href;
    }
  }
  if (['slow', 'fast'].includes(requestedTempo)) keepTempo(requestedTempo);
  speeds.forEach((speed, i) => {
    speed.tabIndex = speed.getAttribute('aria-checked') === 'true' ? 0 : -1;
    speed.addEventListener('click', () => {
      if (speed.getAttribute('aria-checked') === 'true') return;
      speeds.forEach(option => {
        option.setAttribute('aria-checked', String(option === speed));
        option.tabIndex = option === speed ? 0 : -1;
      });
      const tempo = speed.textContent.trim().toLowerCase();
      keepTempo(tempo);
      const url = new URL(location.href);
      url.searchParams.set('tempo', tempo);
      history.replaceState(history.state, '', url);
      if (playing) schedule();
    });
    speed.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const other = speeds[1 - i];
      other.focus();
      other.click();
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) setPlaying(false);
  });
  window.addEventListener('pagehide', () => setPlaying(false));
})();
