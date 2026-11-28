// Play the counted ten-frame example using its authored tiles, labels and feedback screens.
(function () {
  const params = new URLSearchParams(location.hash.slice(1));
  const frames = document.querySelector('.tenframes');
  const authored = Array.from(frames.querySelectorAll('.tenframe__thing'));
  const requested = Number(params.get('total'));
  const size = Number.isInteger(requested) && requested >= 11 && requested <= 20 ? requested : authored.length;
  const total = String(size);
  const empty = frames.querySelector('.tenframe__cell');
  const writing = Boolean(document.querySelector('.digit-pad'));
  Array.from(frames.querySelectorAll('.tenframe > *')).forEach((cell, index) => {
    if (index >= size && cell.matches('button')) cell.replaceWith(empty.cloneNode(true));
    if (index >= size || !cell.matches('.tenframe__cell')) return;
    const toy = authored.at(-1).cloneNode(true);
    const image = authored[index % 3].querySelector('img');
    toy.querySelector('img').src = image.src;
    if (writing) stamp(toy, index + 1);
    else toy.setAttribute('aria-label', 'Count this ' + image.src.split('/').pop().split('.')[0]);
    cell.replaceWith(toy);
  });
  const toys = Array.from(frames.querySelectorAll('.tenframe__thing'));
  frames.setAttribute('aria-label', 'The ten-frames, ' + total + ' toys');
  if (params.has('total')) {
    document.querySelectorAll('.mock-bar__states a, .answer-bar a').forEach(link => {
      link.addEventListener('click', () => {
        const url = new URL(link.href);
        if (new URL('.', url).href !== new URL('.', location.href).href) return;
        const state = new URLSearchParams(url.hash.slice(1));
        state.set('total', total);
        url.hash = state.toString();
        link.href = url.href;
      });
    });
  }
  window.addEventListener('hashchange', () => {
    if (new URLSearchParams(location.hash.slice(1)).get('total') !== params.get('total')) location.reload();
  });
  const attempts = Number(params.get('attempts'));
  const misses = attempts === 1 || attempts === 2 ? attempts : 0;
  const saved = (params.get('order') || '').split(',').map(Number);
  function go(state) {
    const link = document.querySelector('.mock-bar a[href="' + state + '.html"]');
    link.hash = params.toString();
    link.click();
  }

  function stamp(toy, number) {
    let badge = toy.querySelector('.tenframe__badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tenframe__badge';
      badge.setAttribute('aria-hidden', 'true');
      toy.append(badge);
    }
    badge.textContent = number;
    toy.setAttribute('aria-label', 'Toy counted as ' + number);
    toy.classList.add('tenframe__thing--counted');
    toy.classList.remove('press');
    toy.disabled = true;
  }

  if (!writing) {
    if (new URLSearchParams(location.search).get('begin') === '1') {
      toys.forEach(toy => {
        toy.querySelector('.tenframe__badge')?.remove();
        toy.classList.remove('tenframe__thing--counted');
        toy.classList.add('press');
        toy.disabled = false;
        const picture = toy.querySelector('img').getAttribute('src').split('/').pop().split('.')[0];
        toy.setAttribute('aria-label', 'Count this ' + picture);
      });
    }
    const order = toys.flatMap((toy, i) => toy.disabled ? [i] : []);
    toys.forEach((toy, i) => toy.addEventListener('click', event => {
      if (toy.disabled) return;
      order.push(i);
      stamp(toy, order.length);
      toy.querySelector('.tenframe__badge').classList.add('tenframe__badge--new');
      if (order.length === toys.length) {
        params.set('order', order.join(','));
        if (event.detail === 0) params.set('focus', 'digits');
        go('default');
      } else if (event.detail === 0) {
        const next = toys.slice(i + 1).find(item => !item.disabled) || toys.find(item => !item.disabled);
        next?.focus();
      }
    }));
    return;
  }
  if (saved.length === toys.length && new Set(saved).size === saved.length &&
      saved.every(i => Number.isInteger(i) && i >= 0 && i < toys.length)) {
    saved.forEach((i, pos) => stamp(toys[i], pos + 1));
  }
  const keys = Array.from(document.querySelectorAll('.digit-pad__key'));
  if (params.get('focus') === 'digits' && location.pathname.endsWith('/default.html')) {
    keys[0]?.focus();
    params.delete('focus');
  }
  const hint = document.querySelector('.answer-bar--hint');
  const slots = Array.from(document.querySelectorAll('.digit-pad__slot'));
  if (slots[0].classList.contains('digit-pad__slot--filled')) {
    slots.forEach((slot, i) => { slot.textContent = total[i]; });
    slots[0].parentElement.setAttribute('aria-label', 'You wrote ' + total);
  }
  const feedback = document.querySelector('.answer-bar__message');
  if (feedback) feedback.lastChild.textContent = feedback.lastChild.textContent.replace('14', total);
  if (hint) keys.forEach(key => key.classList.toggle('digit-pad__key--lit', key.textContent === total[0]));
  if (hint) {
    bindCountingHint(total.length, digit => {
      slots.forEach((slot, i) => {
        slot.textContent = i <= digit ? total[i] : '';
        slot.classList.toggle('digit-pad__slot--filled', i <= digit);
      });
      slots[0].parentElement.setAttribute('aria-label', 'Watch me write ' + total.slice(0, digit + 1));
      keys.forEach(key => key.classList.toggle('digit-pad__key--lit', key.textContent === total[digit]));
    }, () => go('default'), misses > 0);
  }

  const footer = document.querySelector('.answer-bar--check');
  if (!footer) return;
  const clear = document.querySelector('.digit-pad__clear');
  let check = footer.querySelector('button');
  if (!check) {
    const link = footer.querySelector('a');
    check = document.createElement('button');
    check.type = 'button';
    check.className = link.className;
    check.textContent = link.textContent;
    link.replaceWith(check);
  }
  let written = slots.map(slot => slot.textContent).join('');
  function draw() {
    slots.forEach((slot, i) => {
      slot.textContent = written[i] || '';
      slot.classList.toggle('digit-pad__slot--filled', Boolean(written[i]));
    });
    slots[0].parentElement.setAttribute('aria-label', written ? 'You wrote ' + written : 'Nothing written yet');
    check.disabled = clear.disabled = !written;
  }
  keys.forEach(key => key.addEventListener('click', () => {
    if (written.length === slots.length) return;
    written += key.textContent;
    draw();
  }));
  clear.addEventListener('click', () => { written = ''; draw(); });
  check.addEventListener('click', event => {
    if (written === total) go('correct');
    else {
      if (event.detail === 0 && misses < 2) params.set('focus', 'digits');
      params.set('attempts', misses + 1);
      go(misses === 2 ? 'modelled' : 'hint');
    }
  });
})();
