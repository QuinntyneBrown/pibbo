// The prototype's four fixed questions, in reading and counting order.
(function () {
  const questions = [
    { prompt: 'Which word goes with the picture?', subject: 'read', picture: 'ship', count: 1, options: ['sip', 'ship', 'hip'], answer: 'ship' },
    { prompt: 'How many ducks?', subject: 'count', picture: 'duck', count: 6, options: ['5', '7', '6'], answer: '6' },
    { prompt: 'Which one rhymes with “hat”?', subject: 'read', options: ['sun', 'bat', 'map'], answer: 'bat', pictures: true },
    { prompt: 'Which number is bigger?', subject: 'count', options: ['6', '9', '3'], answer: '9' }
  ];
  const progress = document.querySelector('.progress');
  const params = new URLSearchParams(location.search);
  if (!progress) {
    if (params.get('focus') === 'results') document.querySelector('.results').focus();
    return;
  }
  const requested = new URLSearchParams(location.hash.slice(1)).get('question');
  const number = /^[1-4]$/.test(requested) ? Number(requested) : Number(progress.getAttribute('aria-valuenow'));
  const question = questions[number - 1];
  window.addEventListener('hashchange', () => {
    if (new URLSearchParams(location.hash.slice(1)).get('question') !== requested) location.reload();
  });
  const shell = document.querySelector('.shell');
  shell.classList.toggle('shell--read', question.subject === 'read');
  shell.classList.toggle('shell--count', question.subject === 'count');
  document.querySelector('.hear').classList.toggle('hear--read', question.subject === 'read');
  progress.setAttribute('aria-valuenow', number);
  progress.setAttribute('aria-label', 'Question ' + number + ' of ' + questions.length);
  progress.firstElementChild.className = 'progress__fill progress__fill--q' + number;
  document.querySelector('.bubble__text').textContent = question.prompt;

  function picture(name) {
    const img = document.createElement('img');
    img.className = 'picture';
    img.src = '../../assets/pictures/' + name + '.jpg';
    img.alt = '';
    img.draggable = false;
    return img;
  }
  let show = document.querySelector('.show');
  if (question.picture && !show) {
    show = document.createElement('div');
    show.className = 'show';
    document.querySelector('.pick').before(show);
  }
  if (question.picture) {
    if (question.count !== show.children.length || !show.firstElementChild.src.endsWith('/' + question.picture + '.jpg')) {
      show.replaceChildren(...Array.from({ length: question.count }, () => picture(question.picture)));
    }
    show.classList.toggle('show--one', question.count === 1);
    // One picture is named as a whole. Things to count are named one by one, so the name never
    // says the answer and a screen reader user counts them too.
    if (question.count === 1) {
      show.setAttribute('role', 'img');
      show.setAttribute('aria-label', 'a ' + question.picture);
      show.querySelectorAll('img').forEach(img => { img.alt = ''; });
    } else {
      show.setAttribute('role', 'group');
      show.setAttribute('aria-label', question.picture[0].toUpperCase() + question.picture.slice(1) + 's to count');
      show.querySelectorAll('img').forEach(img => { img.alt = question.picture; });
    }
  } else show?.remove();

  const check = document.querySelector('.answer-bar--check .chunky');
  if (check) {
    check.dataset.checkAction = '';
    check.classList.toggle('chunky--read', question.subject === 'read');
    check.classList.toggle('chunky--count', question.subject === 'count');
  }
  const options = Array.from(document.querySelectorAll('.pick__option'));
  const chosen = params.get('choice');
  const correctIndex = question.options.indexOf(question.answer);
  const retry = document.querySelector('.answer-bar--retry');
  const answered = check?.matches('a');
  const validChoice = /^[0-2]$/.test(chosen);
  let selected = -1;
  if (retry) {
    selected = validChoice && Number(chosen) !== correctIndex ? Number(chosen) : question.options.findIndex(value => value !== question.answer);
  } else if (!check) {
    selected = correctIndex;
  } else if (validChoice || answered) {
    selected = validChoice ? Number(chosen) : correctIndex;
  }
  options.forEach((button, i) => {
    const value = question.options[i];
    const right = value === question.answer;
    button.classList.toggle('pick__option--count', question.subject === 'count');
    button.classList.toggle('pick__option--text', !question.pictures);
    if (question.pictures) {
      button.replaceChildren(picture(value));
      button.setAttribute('aria-label', value);
    } else button.textContent = value;
    button.setAttribute('aria-pressed', String(i === selected));
    if (check) {
      button.dataset.checkHref = (right ? 'correct' : 'retry') + '.html?choice=' + i + '#question=' + number;
      if (i === selected) {
        if (answered) check.href = button.dataset.checkHref;
        else {
          check.disabled = false;
          check.dataset.mockHref = button.dataset.checkHref;
        }
      }
      button.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.set('choice', i);
        history.replaceState(history.state, '', url);
      });
    }
  });
  if (check) {
    check.addEventListener('click', event => {
      const link = check.tagName === 'A';
      const url = new URL(link ? check.href : check.dataset.mockHref, location.href);
      if (event.detail === 0) url.searchParams.set('focus', 'feedback');
      else url.searchParams.delete('focus');
      if (link) check.href = url.href;
      else check.dataset.mockHref = url.href;
    });
  }
  if (params.get('focus') === 'feedback') document.querySelector('.answer-bar a')?.focus();
  if (params.get('focus') === 'answers') options[0].focus();
  if (!check) {
    const next = document.querySelector('.answer-bar a');
    const finished = number === questions.length;
    next.href = finished ? 'results.html' : ['counting-question', 'rhyme-question', 'number-question'][number - 1] + '.html';
    next.addEventListener('click', event => {
      const url = new URL(next.href);
      if (event.detail === 0) url.searchParams.set('focus', finished ? 'results' : 'answers');
      else url.searchParams.delete('focus');
      next.href = url.href;
    });
  }
})();
