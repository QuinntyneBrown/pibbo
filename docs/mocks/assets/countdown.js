// Play the authored countdown or review another start number in the same frame.
(function () {
  const list = document.querySelector('.track-row');
  const params = new URLSearchParams(location.hash.slice(1));
  const from = params.get('from');
  const start = /^\d+$/.test(from) && +from >= 5 && +from <= 20 ? Number(from) : list.children.length - 1;
  const sample = list.querySelector('[aria-current="step"]');
  const first = list.firstElementChild;
  const sampleAt = sample === first ? start : Math.min(start, Number(sample?.textContent));
  const requested = params.get('at');
  if (sample && requested === '0') {
    const finished = new URL('correct.html', location.href);
    finished.search = location.search;
    finished.hash = params.toString();
    location.replace(finished.href);
    return;
  }
  let at = requested && /^\d+$/.test(requested) && +requested >= 1 && +requested <= start
    ? Number(requested) : sampleAt;
  const hiddenMark = list.querySelector('.visually-hidden')?.parentElement.cloneNode(true);
  while (list.children.length > start + 1) list.lastElementChild.remove();
  while (list.children.length < start + 1) list.append(first.cloneNode(false));
  const track = Array.from(list.children);
  list.setAttribute('aria-label', 'Counting down from ' + start);
  if (!sample) {
    track.forEach((cell, i) => { cell.textContent = start - i; });
    if (params.get('focus') === 'next') document.querySelector('.answer-bar--correct a')?.focus();
    return;
  }
  const rocket = document.querySelector('.launch__rocket');
  const launch = rocket.parentElement;
  const buttons = Array.from(document.querySelectorAll('.choices button'));
  const retry = document.querySelector('.answer-bar--retry');
  function roundHash(focus) {
    const next = new URLSearchParams({ from: start, at });
    if (focus) next.set('focus', focus);
    return next.toString();
  }

  function go(state, focus) {
    const link = document.querySelector('.mock-bar a[href="' + state + '.html"]');
    link.hash = roundHash(focus);
    link.click();
  }

  function draw() {
    const distance = start - at;
    track.forEach((cell, i) => {
      cell.classList.toggle('track-row__cell--said', i < distance);
      cell.classList.toggle('track-row__cell--now', i === distance);
      if (i === distance) cell.setAttribute('aria-current', 'step');
      else cell.removeAttribute('aria-current');
      if (i <= distance) cell.textContent = start - i;
      else if (!cell.firstElementChild && hiddenMark) cell.replaceChildren(...hiddenMark.cloneNode(true).childNodes);
    });
    rocket.className = 'launch__rocket launch__rocket--' + distance;
    rocket.style.setProperty('--steps', 10 * distance / start);
    rocket.classList.toggle('launch__rocket--still', distance === 0);
    launch.setAttribute('aria-label', 'The rocket rises one notch for each number, ' + distance + ' so far');
    document.querySelector('.bubble__text').textContent = 'We’re at ' + at + '. What comes next going down?';
    const choices = [at + 1, at - 1, at === 1 ? at + 2 : at - 2]
      .sort((a, b) => (a * 7) % 5 - (b * 7) % 5);
    buttons.forEach((button, index) => { button.textContent = choices[index]; });
    if (retry) {
      retry.querySelector('.answer-bar__message').textContent = 'Going down from ' + at + '… try again.';
      retry.querySelector('a').hash = roundHash();
    }
  }

  // Retain the authored ordering until the reviewer actually advances or resumes a sample.
  if (requested || retry || from) draw();
  retry?.querySelector('a').addEventListener('click', event => {
    event.currentTarget.hash = roundHash(event.detail === 0 ? 'choices' : '');
  });
  if (params.get('focus') === 'retry') retry?.querySelector('a').focus();
  if (params.get('focus') === 'choices') buttons[0]?.focus();
  for (const button of buttons) {
    button.addEventListener('click', event => {
      const next = Number(button.textContent);
      if (next !== at - 1) {
        go('retry', event.detail === 0 ? 'retry' : '');
      } else if (next === 0) {
        at = 0;
        go('correct', event.detail === 0 ? 'next' : '');
      } else {
        at = next;
        draw();
        const url = new URL(location.href);
        url.hash = roundHash();
        history.replaceState(history.state, '', url);
      }
    });
  }
})();
