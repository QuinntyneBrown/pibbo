// Play through the ten-number example drawn on the countdown track.
(function () {
  const track = Array.from(document.querySelectorAll('.track-row__cell'));
  const start = track.length - 1;
  const params = new URLSearchParams(location.hash.slice(1));
  const sample = document.querySelector('.track-row__cell--now');
  if (!sample) return;
  const requested = params.get('at');
  let at = requested && /^\d+$/.test(requested) && +requested >= 1 && +requested <= start
    ? Number(requested) : Number(sample.textContent);
  const rocket = document.querySelector('.launch__rocket');
  const launch = rocket.parentElement;
  const buttons = Array.from(document.querySelectorAll('.choices button'));
  const retry = document.querySelector('.answer-bar--retry');
  const hiddenMark = track.find(cell => cell.querySelector('.visually-hidden'))?.cloneNode(true);

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
    rocket.classList.toggle('launch__rocket--still', distance === 0);
    launch.setAttribute('aria-label', 'The rocket rises one notch for each number, ' + distance + ' so far');
    document.querySelector('.bubble__text').textContent = 'We’re at ' + at + '. What comes next going down?';
    const choices = [...new Set([at + 1, at - 1, Math.max(0, at - 2)])]
      .sort((a, b) => (a * 7) % 5 - (b * 7) % 5);
    buttons.forEach((button, index) => {
      if (index < choices.length) button.textContent = choices[index];
      else button.remove();
    });
    if (retry) {
      retry.querySelector('.answer-bar__message').textContent = 'Going down from ' + at + '… try again.';
      retry.querySelector('a').hash = 'at=' + at;
    }
  }

  // Retain the authored ordering until the reviewer actually advances or resumes a sample.
  if (requested || retry) draw();
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const next = Number(button.textContent);
      if (next !== at - 1) {
        const link = document.querySelector('.mock-bar a[href="retry.html"]');
        link.hash = 'at=' + at;
        link.click();
      } else if (next === 0) {
        document.querySelector('.mock-bar a[href="correct.html"]').click();
      } else {
        at = next;
        draw();
      }
    });
  }
})();
