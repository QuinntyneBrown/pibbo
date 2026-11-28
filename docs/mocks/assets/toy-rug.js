// The numbered badges follow the order in which the reviewer touches the toys.
(function () {
  const rug = document.querySelector('.rug');
  const tally = document.querySelector('.tally__number');
  const params = new URLSearchParams(location.hash.slice(1));
  window.addEventListener('hashchange', () => {
    const next = new URLSearchParams(location.hash.slice(1));
    if (['total', 'counted', 'order', 'attempts'].some(key => next.get(key) !== params.get(key))) location.reload();
  });
  const initial = new URLSearchParams(location.search).get('begin') === '1';
  const requested = Number(params.get('total'));
  const total = Number.isInteger(requested) && requested >= 3 && requested <= 10
    ? requested : rug.children.length;
  const additions = ['teddy', 'ball', 'teddy'];
  const highlighted = rug.querySelector('.rug__toy--highlight') !== null;
  const authoredCount = rug.querySelectorAll('button:disabled').length;
  while (rug.children.length < total) {
    const index = rug.children.length;
    const toy = rug.firstElementChild.cloneNode(true);
    toy.className = 'rug__toy rug__toy--' + index;
    toy.querySelector('img').src = '../../assets/pictures/' + additions[index - 7] + '.jpg';
    rug.append(toy);
  }
  while (rug.children.length > total) rug.lastElementChild.remove();
  const toys = Array.from(rug.children);
  const entered = params.get('counted');
  let counted = total;
  if (tally) {
    const preset = /^\d+$/.test(entered) ? Number(entered) : authoredCount;
    counted = initial ? 0 : Math.min(total, preset);
  }
  rug.setAttribute('aria-label', 'Toys on the rug');
  toys.forEach((toy, i) => {
    const known = i < counted;
    const image = toy.querySelector('img');
    const name = image.src.split('/').pop().split('.')[0];
    let badge = toy.querySelector('.rug__badge');
    toy.disabled = known;
    toy.classList.toggle('rug__toy--counted', known);
    toy.setAttribute('aria-label', known ? 'Toy counted as ' + (i + 1) : 'Count this ' + name);
    if (known) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'rug__badge';
        badge.setAttribute('aria-hidden', 'true');
        toy.append(badge);
      }
      badge.textContent = i + 1;
    } else badge?.remove();
  });
  if (tally) tally.textContent = counted;
  if (highlighted && !rug.querySelector('.rug__toy--highlight')) toys[total - 1].classList.add('rug__toy--highlight');
  const note = document.querySelector('.mock-note');
  if (highlighted && note) note.textContent = note.textContent.replace('4 of 7', Math.min(4, total) + ' of ' + total);
  document.querySelectorAll('.choices .numeral').forEach((button, i) => { button.textContent = total - 1 + i; });
  const message = document.querySelector('.answer-bar__message');
  if (message) message.lastChild.textContent = message.lastChild.textContent.replace('7 toys', total + ' toys');
  function roundState(values) {
    return new URLSearchParams({ total, ...values }).toString();
  }
  if (params.has('total')) {
    document.querySelectorAll('.mock-bar__states a, .answer-bar a').forEach(link => {
      link.addEventListener('click', () => {
        const url = new URL(link.href);
        if (new URL('.', url).href !== new URL('.', location.href).href) return;
        const next = new URLSearchParams(url.hash.slice(1));
        next.set('total', total);
        url.hash = next.toString();
        link.href = url.href;
      });
    });
  }
  const order = toys.flatMap((toy, i) => toy.disabled ? [i] : []);
  if (tally && counted === total) {
    const url = new URL('choose.html', location.href);
    url.search = location.search;
    url.hash = roundState({ order: order.join(',') });
    location.replace(url.href);
    return;
  }
  const saved = (params.get('order') || '').split(',').map(Number);
  const hasOrder = params.has('order') && saved.length === toys.length &&
    new Set(saved).size === toys.length &&
    saved.every(i => Number.isInteger(i) && i >= 0 && i < toys.length);

  const check = document.querySelector('a[data-check-action]');
  const retry = document.querySelector('.rug__toy--highlight');
  if (!tally && (hasOrder || check || retry)) {
    const countedOrder = hasOrder ? saved : order;
    countedOrder.forEach((index, position) => {
      const toy = toys[index];
      toy.querySelector('.rug__badge').textContent = position + 1;
      toy.setAttribute('aria-label', 'Toy counted as ' + (position + 1));
    });
    const previousAttempts = Number(params.get('attempts'));
    const attempts = [1, 2].includes(previousAttempts) ? previousAttempts : 0;
    if (retry && document.querySelector('.answer-bar--retry button')) {
      bindCountingHint(countedOrder.length, position => {
        const next = countedOrder[position];
        toys.forEach((toy, i) => toy.classList.toggle('rug__toy--highlight', i === next));
      }, () => {
        const choose = document.querySelector('.mock-bar a[href="choose.html"]');
        choose.hash = roundState({ order: countedOrder.join(','), attempts: attempts || 1 });
        choose.click();
      }, hasOrder);
    }
    if (check && hasOrder) {
      const button = document.createElement('button');
      button.className = check.className;
      button.textContent = check.textContent;
      button.type = 'button';
      button.disabled = true;
      button.dataset.checkAction = '';
      check.replaceWith(button);
      document.querySelector('[data-check-href]').focus();
    }
    if (check) {
      document.querySelectorAll('[data-check-href]').forEach(choice => {
        if (hasOrder) choice.setAttribute('aria-pressed', 'false');
        const wrong = choice.dataset.checkHref === 'retry.html';
        const state = wrong && attempts === 2 ? 'modelled.html' : choice.dataset.checkHref;
        const result = roundState({ order: countedOrder.join(','), attempts: wrong ? attempts + 1 : attempts });
        choice.dataset.checkHref = state + '#' + result;
        if (choice.getAttribute('aria-pressed') === 'true') check.href = choice.dataset.checkHref;
      });
    }
  }

  if (!tally) return;
  toys.forEach((toy, i) => toy.addEventListener('click', event => {
    if (toy.disabled) return;
    order.push(i);
    const number = order.length;
    const badge = document.createElement('span');
    badge.className = 'rug__badge rug__badge--new';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = number;
    toy.append(badge);
    toy.classList.add('rug__toy--counted');
    toy.disabled = true;
    toy.setAttribute('aria-label', 'Toy counted as ' + number);
    tally.textContent = number;
    if (number === toys.length) {
      const choose = document.querySelector('.mock-bar a[href="choose.html"]');
      choose.hash = roundState({ order: order.join(',') });
      choose.click();
    } else if (event.detail === 0) {
      const next = toys.slice(i + 1).find(item => !item.disabled) || toys.find(item => !item.disabled);
      next?.focus();
    }
  }));
})();
