// Match the two columns using the identifiers declared on the sample cards.
(function () {
  const board = document.querySelector('.pairs');
  const [left, right] = Array.from(board.querySelectorAll('.pairs__column'), column =>
    Array.from(column.querySelectorAll('[data-partner]'))
  );
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
    const requested = new URLSearchParams(location.hash.slice(1)).get('pairs')?.split('.');
    if (requested?.length === left.length && new Set(requested).size === left.length &&
        left.every(card => requested.includes(card.dataset.partner))) {
      for (const card of [...left, ...right]) {
        card.classList.remove('pair--found-' + colour(card));
        card.classList.add('pair--found-' + (requested.indexOf(card.dataset.partner) + 1));
      }
    }
    return;
  }
  if (missed) timer = setTimeout(clearMiss, 260);
  window.addEventListener('pagehide', clearMiss);
  for (const card of left) {
    card.addEventListener('click', () => {
      clearMiss();
      setHeld(card);
    });
  }
  for (const card of right) {
    card.addEventListener('click', () => {
      if (!held) return;
      clearMiss();
      if (card.dataset.partner !== held.dataset.partner) {
        missed = card;
        missed.classList.add('pair--miss');
        if (board.hasAttribute('data-release-on-miss')) setHeld(null);
        timer = setTimeout(clearMiss, 260);
        return;
      }
      order.push(card.dataset.partner);
      for (const partner of [held, card]) {
        partner.classList.add('pair--found-' + order.length);
        partner.disabled = true;
        partner.setAttribute('aria-label', partner.getAttribute('aria-label') + ', matched');
      }
      setHeld(null);
      if (order.length === left.length) {
        const complete = document.querySelector('.mock-bar a[href="correct.html"]');
        complete.hash = new URLSearchParams({ pairs: order.join('.') }).toString();
        complete.click();
      }
    });
  }
})();
