// Match the two columns using the identifiers declared on the sample cards.
(function () {
  const board = document.querySelector('.pairs');
  const [left, right] = Array.from(board.querySelectorAll('.pairs__column'), column =>
    Array.from(column.querySelectorAll('[data-partner]'))
  );
  const feedback = document.querySelector('[data-pair-feedback]');
  const params = new URLSearchParams(location.hash.slice(1));
  const begin = new URLSearchParams(location.search).get('begin') === '1';
  const letters = params.get('letters');
  const screen = document.querySelector('meta[name="mock:screen"]').content;
  const dressUp = screen === 'words-and-pictures' && params.get('theme') === 'dress-up';
  const letterBoard = screen === 'big-and-small-letters';
  window.addEventListener('hashchange', () => {
    const next = new URLSearchParams(location.hash.slice(1));
    if (['letters', 'theme', 'paired', 'pairs'].some(key => next.get(key) !== params.get(key))) location.reload();
  });

  function preserveSet(key, value) {
    document.querySelectorAll('.mock-bar__states a').forEach(link => {
      link.addEventListener('click', () => {
        const state = new URLSearchParams(link.hash.slice(1));
        state.set(key, value);
        link.hash = state.toString();
      });
    });
  }

  if (letterBoard && ['A B D G', 'M N H R', 'E F Q T'].includes(letters)) {
    const set = letters.split(' ');
    const byPartner = new Map(left.map((card, index) => [card.dataset.partner, set[index]]));
    for (const column of [left, right]) {
      for (const card of column) {
        const big = column === left;
        const letter = byPartner.get(card.dataset.partner);
        const label = big ? letter : letter.toLowerCase();
        card.dataset.partner = letter.toLowerCase();
        card.querySelector('.pair__letter').textContent = label;
        card.setAttribute('aria-label', (big ? 'Big ' : 'Small ') + label + (card.disabled ? ', matched' : ''));
      }
    }
    preserveSet('letters', letters);
  }
  if (dressUp) {
    const words = ['hat', 'cap', 'cape', 'teddy'];
    const byPartner = new Map(left.map((card, i) => [card.dataset.partner, words[i]]));
    for (const card of [...left, ...right]) {
      const word = byPartner.get(card.dataset.partner);
      const image = card.querySelector('.picture');
      if (image) image.src = '../../assets/pictures/' + word + '.jpg';
      else card.querySelector('.pair__word').textContent = word;
      card.dataset.partner = word;
      const label = image ? 'Picture of a ' + word : word;
      card.setAttribute('aria-label', label + (card.disabled ? ', matched' : ''));
    }
    document.querySelector('.bubble__text').textContent = 'Dress-up box! Read a word, then tap its picture.';
    const praise = document.querySelector('.answer-bar--correct .answer-bar__message');
    if (praise) praise.lastChild.textContent = 'You read all the dress-up box words!';
    preserveSet('theme', 'dress-up');
  }
  const paired = params.get('paired');
  const preset = location.pathname.endsWith('/default.html') && /^[0-4]$/.test(paired);
  const saved = params.get('pairs')?.split('.');
  const validOrder = saved && new Set(saved).size === saved.length &&
    saved.every(id => left.some(card => card.dataset.partner === id));
  if (feedback && (validOrder || begin || preset)) {
    const count = validOrder ? saved.length : begin ? 0 : Number(paired);
    if (count === left.length) {
      const url = new URL('correct.html', location.href);
      url.search = location.search;
      url.hash = params.toString();
      location.replace(url.href);
      return;
    }
    const matched = validOrder ? saved : left.slice(0, count).map(card => card.dataset.partner);
    for (const card of [...left, ...right]) {
      if (card.disabled) card.classList.remove('pair--found-' + colour(card));
      const index = matched.indexOf(card.dataset.partner);
      card.disabled = index >= 0;
      card.classList.remove('pair--miss');
      if (card.hasAttribute('aria-pressed')) card.setAttribute('aria-pressed', 'false');
      if (card.disabled) card.classList.add('pair--found-' + (index + 1));
      const name = card.getAttribute('aria-label').replace(/, matched$/, '');
      card.setAttribute('aria-label', name + (card.disabled ? ', matched' : ''));
    }
  }
  const order = left.filter(card => card.disabled)
    .sort((a, b) => colour(a) - colour(b))
    .map(card => card.dataset.partner);
  let held = left.find(card => card.getAttribute('aria-pressed') === 'true');
  let missed = board.querySelector('.pair--miss');
  let timer;

  function colour(card) {
    return Number(Array.from(card.classList).find(name => name.startsWith('pair--found-'))?.slice(-1));
  }

  function setHeld(card) {
    held?.setAttribute('aria-pressed', 'false');
    held = card;
    held?.setAttribute('aria-pressed', 'true');
  }

  function clearMiss() {
    clearTimeout(timer);
    missed?.classList.remove('pair--miss');
    missed = null;
  }

  if (left.every(card => card.disabled)) {
    const requested = params.get('pairs')?.split('.');
    if (requested?.length === left.length && new Set(requested).size === left.length &&
        left.every(card => requested.includes(card.dataset.partner))) {
      for (const card of [...left, ...right]) {
        card.classList.remove('pair--found-' + colour(card));
        card.classList.add('pair--found-' + (requested.indexOf(card.dataset.partner) + 1));
      }
      if (params.get('focus') === 'next') document.querySelector('.answer-bar a')?.focus();
    }
    return;
  }
  if (missed) timer = setTimeout(clearMiss, 260);
  window.addEventListener('pagehide', clearMiss);
  for (const card of left) {
    card.addEventListener('click', event => {
      clearMiss();
      setHeld(card);
      feedback.textContent = '';
      if (event.detail === 0) right.find(option => !option.disabled)?.focus();
    });
  }
  for (const card of right) {
    card.addEventListener('click', event => {
      if (!held) return;
      clearMiss();
      if (card.dataset.partner !== held.dataset.partner) {
        feedback.textContent = held.getAttribute('aria-label') + ' and ' + card.getAttribute('aria-label') + '. Try again.';
        missed = card;
        missed.classList.add('pair--miss');
        if (board.hasAttribute('data-release-on-miss')) {
          const previous = held;
          setHeld(null);
          if (event.detail === 0) previous.focus();
        }
        timer = setTimeout(clearMiss, 260);
        return;
      }
      order.push(card.dataset.partner);
      feedback.textContent = held.getAttribute('aria-label') + ' and ' + card.getAttribute('aria-label') + ' matched. ' + order.length + ' of ' + left.length + ' pairs.';
      for (const partner of [held, card]) {
        partner.classList.add('pair--found-' + order.length);
        partner.disabled = true;
        partner.setAttribute('aria-label', partner.getAttribute('aria-label') + ', matched');
      }
      setHeld(null);
      if (order.length === left.length) {
        const complete = document.querySelector('.mock-bar a[href="correct.html"]');
        const params = new URLSearchParams({ pairs: order.join('.') });
        if (event.detail === 0) params.set('focus', 'next');
        complete.hash = params.toString();
        complete.click();
      } else {
        const url = new URL(location.href);
        const state = new URLSearchParams(url.hash.slice(1));
        state.set('pairs', order.join('.'));
        state.delete('paired');
        url.hash = state.toString();
        history.replaceState(history.state, '', url);
        if (event.detail === 0) left.find(option => !option.disabled)?.focus();
      }
    });
  }
})();
