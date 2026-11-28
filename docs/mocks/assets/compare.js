// The default drawing is seven and four. Reviewers can also inspect a specified pair.
(function () {
  const cards = Array.from(document.querySelectorAll('.compare__card'));
  const params = new URLSearchParams(location.search);
  const requested = ['left', 'right'].map(side => params.get(side));
  const custom = requested.every(value => /^(?:[0-9]|1[0-9]|20)$/.test(value)) && requested[0] !== requested[1];
  const numbers = custom ? requested.map(Number) : cards.map(card => Number(card.querySelector('.compare__number').textContent));
  const larger = Math.max(...numbers);
  const smaller = Math.min(...numbers);
  const retry = document.querySelector('.answer-bar--retry');
  const correct = document.querySelector('.answer-bar--correct');
  const check = document.querySelector('[data-check-action]');
  const wasPicked = cards.some(card => card.getAttribute('aria-pressed') === 'true');

  function withPair(href) {
    const url = new URL(href, location.href);
    url.searchParams.set('left', numbers[0]);
    url.searchParams.set('right', numbers[1]);
    return url.href;
  }

  cards.forEach((card, index) => {
    const number = numbers[index];
    const bigger = number === larger;
    let name = number + ', ' + number + (number === 1 ? ' dot' : ' dots');
    if (retry && bigger) {
      const extra = larger - smaller;
      name += ', ' + extra + (extra === 1 ? ' extra dot' : ' extra dots');
    }
    card.setAttribute('aria-label', name);
    if (!custom) return;
    card.querySelector('.compare__number').textContent = number;
    const frame = card.querySelector('.ten-frame');
    const cell = frame.firstElementChild.cloneNode(false);
    const dot = document.createElement('span');
    dot.className = 'ten-frame__dot';
    for (let start = 0; start < Math.max(number, 1); start += 10) {
      const row = frame.cloneNode(false);
      for (let i = start; i < start + 10; i++) {
        const place = cell.cloneNode(false);
        if (i < number) {
          const mark = dot.cloneNode(false);
          mark.classList.toggle('ten-frame__dot--extra', Boolean(retry) && i >= smaller);
          place.append(mark);
        }
        row.append(place);
      }
      card.append(row);
    }
    frame.remove();
    card.classList.toggle('compare__card--won', Boolean(correct) && bigger);
    card.setAttribute('aria-pressed', String(wasPicked && (retry ? !bigger : bigger)));
    if (check) card.dataset.checkHref = withPair(bigger ? 'correct.html' : 'retry.html');
  });
  const picked = params.get('picked');
  if (check && ['none', 'left', 'right'].includes(picked)) {
    // Use the same selection handler for a frame preset and a child's tap.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = check.className;
    button.textContent = check.textContent;
    button.dataset.checkAction = '';
    button.disabled = true;
    check.replaceWith(button);
    cards.forEach(card => card.setAttribute('aria-pressed', 'false'));
    if (picked !== 'none') cards[picked === 'left' ? 0 : 1].click();
  }
  if (!custom) return;
  if (check?.tagName === 'A') check.href = withPair('correct.html');
  if (correct) correct.querySelector('.answer-bar__message').lastChild.textContent = larger + ' is bigger than ' + smaller + '!';
  document.querySelectorAll('.mock-bar__states a, .answer-bar--retry a').forEach(link => { link.href = withPair(link.href); });
})();
