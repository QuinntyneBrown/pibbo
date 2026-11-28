// The numbered badges follow the order in which the reviewer touches the toys.
(function () {
  const toys = Array.from(document.querySelectorAll('.rug__toy'));
  const tally = document.querySelector('.tally__number');
  const order = toys.flatMap((toy, i) => toy.disabled ? [i] : []);
  const params = new URLSearchParams(location.hash.slice(1));
  const saved = (params.get('order') || '').split(',').map(Number);
  const hasOrder = params.has('order') && saved.length === toys.length &&
    new Set(saved).size === toys.length &&
    saved.every(i => Number.isInteger(i) && i >= 0 && i < toys.length);

  if (hasOrder && !tally) {
    saved.forEach((index, position) => {
      const toy = toys[index];
      toy.querySelector('.rug__badge').textContent = position + 1;
      toy.setAttribute('aria-label', 'Toy counted as ' + (position + 1));
    });
    const previousAttempts = Number(params.get('attempts'));
    const attempts = [1, 2].includes(previousAttempts) ? previousAttempts : 0;
    const retry = document.querySelector('.rug__toy--highlight');
    if (retry && document.querySelector('.answer-bar--retry button')) {
      retry.classList.remove('rug__toy--highlight');
      let position = 0;
      const nextToy = () => {
        if (document.hidden) return;
        if (position) toys[saved[position - 1]].classList.remove('rug__toy--highlight');
        if (position < saved.length) {
          toys[saved[position++]].classList.add('rug__toy--highlight');
        } else {
          clearInterval(timer);
          const choose = document.querySelector('.mock-bar a[href="choose.html"]');
          choose.hash = params.toString();
          choose.click();
        }
      };
      nextToy();
      const timer = setInterval(nextToy, 700);
      window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
    }
    const check = document.querySelector('a[data-check-action]');
    if (check) {
      const button = document.createElement('button');
      button.className = check.className;
      button.textContent = check.textContent;
      button.type = 'button';
      button.disabled = true;
      button.dataset.checkAction = '';
      check.replaceWith(button);
      document.querySelectorAll('[data-check-href]').forEach(choice => {
        choice.setAttribute('aria-pressed', 'false');
        const wrong = choice.dataset.checkHref === 'retry.html';
        const state = wrong && attempts === 2 ? 'modelled.html' : choice.dataset.checkHref;
        const result = new URLSearchParams({ order: saved.join(','), attempts: wrong ? attempts + 1 : attempts });
        choice.dataset.checkHref = state + '#' + result.toString();
      });
      document.querySelector('[data-check-href]').focus();
    }
  }

  if (!tally) return;
  toys.forEach((toy, i) => toy.addEventListener('click', () => {
    if (toy.disabled) return;
    order.push(i);
    const number = order.length;
    const badge = document.createElement('span');
    badge.className = 'rug__badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = number;
    toy.append(badge);
    toy.classList.add('rug__toy--counted');
    toy.disabled = true;
    toy.setAttribute('aria-label', 'Toy counted as ' + number);
    tally.textContent = number;
    if (number === toys.length) {
      const choose = document.querySelector('.mock-bar a[href="choose.html"]');
      choose.hash = 'order=' + order.join(',');
      choose.click();
    }
  }));
})();
