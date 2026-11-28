// Keep the two illustrated sets together when moving between the authored states.
(function () {
  const groups = Array.from(document.querySelectorAll('.player__ducks'));
  const counts = groups.map(group => group.children.length);
  const turn = document.querySelector('.player[aria-current="step"]');
  const active = turn ? groups.indexOf(turn.querySelector('.player__ducks')) : -1;
  const params = new URLSearchParams(location.hash.slice(1));
  const valid = ['star', 'moon'].every(key => {
    const value = params.get(key);
    return value !== null && /^[0-5]$/.test(value) && (Number(value) > 0 || active === 0 || (active === 1 && key === 'moon'));
  });
  if (valid) counts.splice(0, 2, Number(params.get('star')), Number(params.get('moon')));
  const answer = document.querySelector('.sum__answer');
  const options = Array.from(document.querySelectorAll('.choices button'));
  let pick = /^\d+$/.test(answer.textContent) ? Number(answer.textContent) : null;
  const total = () => counts[0] + counts[1];
  const correct = document.querySelector('.answer-bar--correct');
  const retry = document.querySelector('.answer-bar--retry a');
  if (valid && active < 0) {
    const savedPick = params.has('pick') ? Number(params.get('pick')) : NaN;
    const isOption = Number.isInteger(savedPick) && Math.abs(savedPick - total()) <= 1;
    if (correct) pick = total();
    else if (retry) pick = isOption && savedPick !== total() ? savedPick : total() + 1;
    else if (isOption) pick = savedPick;
    else if (pick !== null) pick = total();
  }
  const controls = document.querySelectorAll('.turn-controls button');
  const action = document.querySelector('.answer-bar--check .chunky');

  function href(state) {
    const values = new URLSearchParams({ star: counts[0], moon: counts[1] });
    if (pick !== null) values.set('pick', pick);
    return state + '.html#' + values;
  }

  function draw() {
    groups.forEach((group, i) => {
      while (group.children.length > counts[i]) group.lastElementChild.remove();
      while (group.children.length < counts[i]) {
        const duck = document.createElement('img');
        duck.src = '../../assets/pictures/duck.jpg';
        duck.className = 'picture';
        duck.alt = 'duck';
        duck.draggable = false;
        group.append(duck);
      }
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', (i === 0 ? 'Star' : 'Moon') + ', ' + counts[i] + (counts[i] === 1 ? ' duck' : ' ducks'));
      group.parentElement.querySelector('.player__adds').textContent = 'adds ' + counts[i];
    });
    answer.previousSibling.textContent = counts.join(' + ') + ' = ';
    answer.textContent = pick ?? '?';
    options.forEach((option, i) => {
      const value = total() - 1 + i;
      option.textContent = value;
      option.setAttribute('aria-pressed', String(value === pick));
    });
    if (turn) {
      controls[0].disabled = action.disabled = counts[active] === 0;
      controls[1].disabled = counts[active] === 5;
      action.dataset.mockHref = href(active === 0 ? 'moon-turn' : 'default');
    } else if (action) {
      const target = href(pick === total() ? 'correct' : 'retry');
      if (action.tagName === 'A') action.href = target;
      else {
        action.disabled = pick === null;
        action.dataset.mockHref = target;
      }
    }
  }

  controls.forEach((button, i) => button.addEventListener('click', event => {
    counts[active] += i === 0 ? -1 : 1;
    draw();
    if (event.detail === 0 && button.disabled) controls[1 - i].focus();
  }));
  options.forEach(option => option.addEventListener('click', () => {
    pick = Number(option.textContent);
    draw();
  }));
  draw();

  if (retry) {
    pick = null;
    retry.href = href('default');
    const ducks = groups.flatMap(group => Array.from(group.children));
    let timer;
    let current;
    function stopRecount() {
      clearInterval(timer);
      ducks.forEach(duck => duck.classList.remove('picture--recount'));
    }
    function recount() {
      stopRecount();
      let i = 0;
      function next() {
        current?.classList.remove('picture--recount');
        current = ducks[i++];
        if (current) current.classList.add('picture--recount');
        else stopRecount();
      }
      next();
      timer = setInterval(next, 650);
    }
    if (valid) recount();
    document.querySelector('.hear').addEventListener('click', recount);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopRecount(); });
    window.addEventListener('pagehide', stopRecount);
  }
  const nextAction = action || retry;
  if (nextAction) {
    nextAction.addEventListener('click', event => {
      const link = nextAction.tagName === 'A';
      const url = new URL(link ? nextAction.href : nextAction.dataset.mockHref, location.href);
      if (event.detail === 0) url.searchParams.set('focus', 'pond');
      else url.searchParams.delete('focus');
      if (link) nextAction.href = url.href;
      else nextAction.dataset.mockHref = url.href;
    });
  }
  const url = new URL(location.href);
  if (url.searchParams.get('focus') === 'pond') {
    let target = options[0];
    if (turn) target = controls[1].disabled ? controls[0] : controls[1];
    else if (correct || retry) target = document.querySelector('.answer-bar a');
    target?.focus();
    url.searchParams.delete('focus');
    history.replaceState(history.state, '', url);
  }
  const praise = document.querySelector('.answer-bar--correct .answer-bar__message');
  if (praise) praise.lastChild.textContent = counts.join(' and ') + ' make ' + total() + '! Great teamwork.';
})();
