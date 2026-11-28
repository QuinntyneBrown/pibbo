// The frame offers three target words in the same illustrated story.
(function () {
  const words = Array.from(document.querySelectorAll('.story__word'));
  const params = new URLSearchParams(location.search);
  const requested = params.get('target');
  const target = ['is', 'a'].includes(requested) ? requested : 'the';
  const matches = words.filter(word => word.textContent.toLowerCase().replace(/[.,!?]/g, '') === target);
  const counter = document.querySelector('.found');
  const complete = document.querySelector('.answer-bar--correct');
  const preset = params.get('found');
  const drawn = document.querySelectorAll('.story__word--found').length;
  let count = /^[0-9]+$/.test(preset) ? Math.min(Number(preset), matches.length) : drawn;
  if (params.get('begin') === '1') count = 0;
  if (complete) count = matches.length;
  if (!complete && count === matches.length) {
    const url = new URL('correct.html', location.href);
    url.search = location.search;
    location.replace(url.href);
    return;
  }
  const status = document.querySelector('.story__status');
  let pending;
  let missed = document.querySelector('.story__word--miss');

  document.querySelector('.target-word').textContent = target;
  document.querySelector('.bubble__text').textContent = 'Find every “' + target + '” in the story.';
  if (complete) {
    complete.querySelector('.answer-bar__message').lastChild.textContent = 'You found “' + target + '” ' + matches.length + ' times!';
    if (params.get('focus') === 'next') complete.querySelector('a').focus();
  }
  if (target !== 'the') {
    document.querySelectorAll('.mock-bar__states a').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('target', target);
      link.href = url.href;
    });
  }
  const dots = matches.map(() => counter.firstElementChild.cloneNode(false));
  counter.replaceChildren(...dots);

  function drawCount() {
    dots.forEach((dot, i) => dot.classList.toggle('found__dot--on', i < count));
    counter.setAttribute('aria-label', count + ' of ' + matches.length + ' found');
  }

  function mark(word, found) {
    word.disabled = Boolean(complete) || found;
    word.classList.toggle('story__word--found', found);
    if (found) word.setAttribute('aria-label', word.textContent + ', found');
    else word.removeAttribute('aria-label');
  }

  function clearMiss() {
    clearTimeout(pending);
    missed?.classList.remove('story__word--miss');
    missed = null;
  }

  if (missed) pending = setTimeout(clearMiss, 400);
  window.addEventListener('pagehide', clearMiss);
  drawCount();
  for (const [i, word] of words.entries()) {
    const position = matches.indexOf(word);
    mark(word, position >= 0 && position < count);
    word.addEventListener('click', event => {
      clearMiss();
      if (position < 0) {
        status.textContent = 'Look for “' + target + '”. You chose “' + word.textContent + '”.';
        missed = word;
        missed.classList.add('story__word--miss');
        pending = setTimeout(clearMiss, 400);
        return;
      }
      mark(word, true);
      count++;
      drawCount();
      status.textContent = 'Found “' + target + '”. ' + count + ' of ' + matches.length + ' found.';
      if (count === matches.length) {
        const link = document.querySelector('.mock-bar__states a[href*="correct.html"]');
        if (event.detail === 0) {
          const url = new URL(link.href);
          url.searchParams.set('focus', 'next');
          link.href = url.href;
        }
        link.click();
      } else if (event.detail === 0) {
        const next = words.slice(i + 1).find(item => !item.disabled) || words.find(item => !item.disabled);
        next?.focus();
      }
    });
  }
})();
