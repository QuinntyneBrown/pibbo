// Each mock opens at its illustrated hop. Changes stay on the local number line.
(function () {
  const steps = Array.from(document.querySelectorAll('.switch--step [role="radio"]'));
  const line = document.querySelector('.number-line');
  const dots = Array.from(line.querySelectorAll('circle'));
  const buttons = Array.from(document.querySelectorAll('.choices button'));
  const retry = document.querySelector('.answer-bar--retry');
  const success = document.querySelector('.answer-bar--correct');
  const last = dots.length - 1;
  const params = new URLSearchParams(location.hash.slice(1));
  const stepOf = button => Number(button.dataset.by);
  let by = stepOf(steps.find(button => button.getAttribute('aria-checked') === 'true'));
  let hops = line.querySelectorAll('.number-line__dot--said').length - 1;

  function navigate(state, position) {
    const link = document.querySelector('.mock-bar a[href="' + state + '.html"]');
    link.hash = new URLSearchParams({ by, hops: position }).toString();
    link.click();
  }

  function draw() {
    line.querySelectorAll('path, text').forEach(element => element.remove());
    const values = [];
    dots.forEach((dot, i) => {
      const said = i <= hops;
      dot.setAttribute('class', 'number-line__dot' + (said ? ' number-line__dot--said' : i === hops + 1 ? ' number-line__dot--next' : ''));
      dot.setAttribute('r', said ? '13' : '9');
      if (i > hops + 1) return;
      const x = Number(dot.getAttribute('cx'));
      if (said && i > 0) {
        const arc = document.createElementNS(line.namespaceURI, 'path');
        arc.setAttribute('class', 'number-line__hop');
        arc.setAttribute('d', 'M' + (x - 92) + ' 100 Q' + (x - 50) + ' 20 ' + (x - 8) + ' 100');
        line.insertBefore(arc, dot);
      }
      const label = document.createElementNS(line.namespaceURI, 'text');
      label.setAttribute('class', 'number-line__label' + (said ? '' : ' number-line__label--next'));
      label.setAttribute('x', x);
      label.setAttribute('y', '160');
      label.textContent = said ? i * by : '?';
      line.append(label);
      if (said) values.push(i * by);
    });
    line.setAttribute('aria-label', 'Number line counting by ' + by + ': ' + values.join(', '));
    steps.forEach(button => {
      const active = stepOf(button) === by;
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const next = (hops + 1) * by;
    const options = [next - 1, next, next + by].sort((a, b) => (a * 13) % 7 - (b * 13) % 7);
    buttons.forEach((button, i) => { button.textContent = options[i]; });
    document.querySelector('.bubble__text').textContent = success
      ? 'You counted by ' + by + 's to ' + last * by + '!' : 'Hop by ' + by + 's. Where do we land next?';
    if (retry) {
      retry.querySelector('.answer-bar__message').textContent = 'Count on ' + by + ' more from ' + by * hops + '.';
      retry.querySelector('a').hash = new URLSearchParams({ by, hops }).toString();
    }
    if (success) success.querySelector('.answer-bar__message').lastChild.textContent = 'Hop, hop, hop — all the way to ' + last * by + '!';
  }

  const requestedStep = Number(params.get('by'));
  const requestedHop = Number(params.get('hops'));
  if (steps.some(button => stepOf(button) === requestedStep) && params.has('hops') &&
      Number.isInteger(requestedHop) && requestedHop >= 0 && requestedHop <= last &&
      (success ? requestedHop === last : requestedHop < last)) {
    by = requestedStep;
    hops = requestedHop;
    draw();
  }
  steps.forEach((button, i) => {
    button.tabIndex = stepOf(button) === by ? 0 : -1;
    button.addEventListener('click', () => {
      by = stepOf(button);
      hops = 0;
      if (retry || success) navigate('start', hops);
      else draw();
    });
    button.addEventListener('keydown', event => {
      const delta = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      const next = steps[(i + delta + steps.length) % steps.length];
      next.focus();
      next.click();
    });
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    if (Number(button.textContent) !== (hops + 1) * by) { navigate('retry', hops); return; }
    hops++;
    if (hops === last) navigate('correct', hops);
    else draw();
  }));
})();
