// The playing frame opens on its illustrated beat so it can be inspected in the gallery.
(function () {
  const number = document.querySelector('.dance__number');
  const beats = Array.from(document.querySelectorAll('.chant__beat'));
  const toggle = document.querySelector('.controls > button');
  const speeds = Array.from(document.querySelectorAll('.switch--speed button'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let beat = Number(number.textContent) || 0;
  let playing = toggle.textContent.trim() === 'Pause';
  const poses = {
    [playing ? 'cheer' : 'rest']: document.querySelector('.dance .pibbo'),
    [playing ? 'pause' : 'play']: toggle.querySelector('svg')
  };
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
    toggle.replaceChildren(clone(value ? 'pause' : 'play'), value ? ' Pause' : beat ? ' Keep dancing' : ' Start the music');
    if (!value) pulse?.cancel();
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
    number.textContent = beat;
    beats.forEach((item, i) => {
      item.classList.toggle('chant__beat--said', i + 1 < beat);
      item.classList.toggle('chant__beat--now', i + 1 === beat);
      if (i + 1 === beat) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    document.querySelector('.dance .pibbo').classList.toggle('dance__pibbo--sway', beat % 2 === 1);
    if (!reduced.matches) {
      pulse?.cancel();
      pulse = number.animate([{ scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1 }], 160);
    }
    schedule();
  }

  toggle.addEventListener('click', () => {
    setPlaying(!playing);
    if (playing) advance();
  });

  speeds.forEach((speed, i) => {
    speed.tabIndex = speed.getAttribute('aria-checked') === 'true' ? 0 : -1;
    speed.addEventListener('click', () => {
      speeds.forEach(option => {
        option.setAttribute('aria-checked', String(option === speed));
        option.tabIndex = option === speed ? 0 : -1;
      });
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
