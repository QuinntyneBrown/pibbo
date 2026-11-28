// Keep the two illustrated sets together when moving between the authored states.
(function () {
  const groups = Array.from(document.querySelectorAll('.player__ducks'));
  const counts = groups.map(group => group.children.length);
  const turn = document.querySelector('.player[aria-current="step"]');
  const active = turn ? groups.indexOf(turn.querySelector('.player__ducks')) : -1;
  const params = new URLSearchParams(location.hash.slice(1));
  const valid = ['star', 'moon'].every(key => {
    const value = params.get(key);
    return value !== null && /^[0-5]$/.test(value) && (active >= 0 || Number(value) > 0);
  });
  if (valid) counts.splice(0, 2, Number(params.get('star')), Number(params.get('moon')));
  const answer = document.querySelector('.sum__answer');
  const options = Array.from(document.querySelectorAll('.choices button'));
  let pick = /^\d+$/.test(answer.textContent) ? Number(answer.textContent) : null;
  const total = () => counts[0] + counts[1];
  if (valid) pick = null;
  if (valid && /^\d+$/.test(params.get('pick')) && Math.abs(Number(params.get('pick')) - total()) <= 1) {
    pick = Number(params.get('pick'));
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

  controls.forEach((button, i) => button.addEventListener('click', () => {
    counts[active] += i === 0 ? -1 : 1;
    draw();
  }));
  options.forEach(option => option.addEventListener('click', () => {
    pick = Number(option.textContent);
    draw();
  }));
  draw();

  const retry = document.querySelector('.answer-bar--retry a');
  if (retry) {
    pick = null;
    retry.href = href('default');
    if (valid) {
      const ducks = groups.flatMap(group => Array.from(group.children));
      let index = 0;
      ducks[index].classList.add('picture--recount');
      const timer = setInterval(() => {
        if (document.hidden) return;
        ducks[index++].classList.remove('picture--recount');
        if (index === ducks.length) clearInterval(timer);
        else ducks[index].classList.add('picture--recount');
      }, 650);
      window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
    }
  }
  const praise = document.querySelector('.answer-bar--correct .answer-bar__message');
  if (praise) praise.lastChild.textContent = counts.join(' and ') + ' make ' + total() + '! Great teamwork.';
})();
