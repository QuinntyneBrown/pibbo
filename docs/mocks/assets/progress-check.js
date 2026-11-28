// The prototype's four fixed questions, in reading and counting order.
(function () {
  const questions = [
    { prompt: 'Which word goes with the picture?', subject: 'read', picture: 'ship', count: 1, options: ['sip', 'ship', 'hip'], answer: 'ship' },
    { prompt: 'How many ducks?', subject: 'count', picture: 'duck', count: 6, options: ['5', '7', '6'], answer: '6' },
    { prompt: 'Which one rhymes with “hat”?', subject: 'read', options: ['sun', 'bat', 'map'], answer: 'bat', pictures: true },
    { prompt: 'Which number is bigger?', subject: 'count', options: ['6', '9', '3'], answer: '9' }
  ];
  const progress = document.querySelector('.progress');
  const requested = new URLSearchParams(location.hash.slice(1)).get('question');
  const number = /^[1-4]$/.test(requested) ? Number(requested) : Number(progress.getAttribute('aria-valuenow'));
  const question = questions[number - 1];
  const shell = document.querySelector('.shell');
  shell.classList.toggle('shell--read', question.subject === 'read');
  shell.classList.toggle('shell--count', question.subject === 'count');
  document.querySelector('.hear').classList.toggle('hear--read', question.subject === 'read');
  progress.setAttribute('aria-valuenow', number);
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
  const show = document.querySelector('.show');
  if (question.picture) {
    if (question.count !== show.children.length || !show.firstElementChild.src.endsWith('/' + question.picture + '.jpg')) {
      show.replaceChildren(...Array.from({ length: question.count }, () => picture(question.picture)));
    }
    show.classList.toggle('show--one', question.count === 1);
    show.setAttribute('aria-label', question.count + ' ' + question.picture + (question.count === 1 ? '' : 's'));
  } else show.remove();

  const check = document.querySelector('.answer-bar--check .chunky');
  if (check) {
    check.dataset.checkAction = '';
    check.classList.toggle('chunky--read', question.subject === 'read');
    check.classList.toggle('chunky--count', question.subject === 'count');
  }
  const options = Array.from(document.querySelectorAll('.pick__option'));
  const chosen = new URLSearchParams(location.search).get('choice');
  options.forEach((button, i) => {
    const value = question.options[i];
    const right = value === question.answer;
    button.classList.toggle('pick__option--count', question.subject === 'count');
    button.classList.toggle('pick__option--text', !question.pictures);
    if (question.pictures) {
      button.replaceChildren(picture(value));
      button.setAttribute('aria-label', value);
    } else button.textContent = value;
    if (check) {
      button.dataset.checkHref = (right ? 'correct' : 'retry') + '.html?choice=' + i + '#question=' + number;
    } else if (/^[0-2]$/.test(chosen)) {
      button.setAttribute('aria-pressed', String(i === Number(chosen)));
    }
  });
  if (!check) {
    const next = document.querySelector('.answer-bar a');
    next.href = number === questions.length ? 'results.html' : 'counting-question.html#question=' + (number + 1);
  }
})();
