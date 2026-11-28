// Play the counted ten-frame example using its authored tiles, labels and feedback screens.
(function () {
  const toys = Array.from(document.querySelectorAll('.tenframe__thing'));
  const total = String(toys.length);
  const params = new URLSearchParams(location.hash.slice(1));
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

  if (!document.querySelector('.digit-pad')) {
    const order = toys.flatMap((toy, i) => toy.disabled ? [i] : []);
    toys.forEach((toy, i) => toy.addEventListener('click', () => {
      if (toy.disabled) return;
      order.push(i);
      stamp(toy, order.length);
      if (order.length === toys.length) {
        params.set('order', order.join(','));
        go('default');
      }
    }));
    return;
  }
  if (saved.length === toys.length && new Set(saved).size === saved.length &&
      saved.every(i => Number.isInteger(i) && i >= 0 && i < toys.length)) {
    saved.forEach((i, pos) => stamp(toys[i], pos + 1));
  }
  const keys = Array.from(document.querySelectorAll('.digit-pad__key'));
  const hint = document.querySelector('.answer-bar--hint');
  if (hint && misses) {
    let digit = 0;
    const timer = setInterval(() => {
      if (document.hidden) return;
      digit++;
      if (digit === total.length) {
        clearInterval(timer);
        go('default');
      } else {
        keys.forEach(key => key.classList.toggle('digit-pad__key--lit', key.textContent === total[digit]));
      }
    }, 700);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  }

  const footer = document.querySelector('.answer-bar--check');
  if (!footer) return;
  const slots = Array.from(document.querySelectorAll('.digit-pad__slot'));
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
  check.addEventListener('click', () => {
    if (written === total) go('correct');
    else {
      params.set('attempts', misses + 1);
      go(misses === 2 ? 'modelled' : 'hint');
    }
  });
})();
