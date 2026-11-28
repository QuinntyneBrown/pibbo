// The two five-game paths illustrated in the prototype.
(function () {
  const paths = {
    read: [
      ['Letter sounds', 'letter-sounds/start'], ['Sound it out', 'sound-it-out/default'],
      ['Two letters, one sound', 'sound-it-out/default'], ['Rhyme time', 'rhyme-time/start'],
      ['Build a sentence', 'build-a-sentence/start']
    ],
    count: [
      ['Count the toys', 'count-the-toys/start'], ['Count and write', 'count-and-write/start'],
      ['Which is bigger?', 'which-is-bigger/default'], ['Rocket countdown', 'rocket-countdown/start'],
      ['Counting dance', 'counting-dance/start']
    ]
  };
  const params = new URLSearchParams(location.search);
  const sheet = document.querySelector('.lesson');
  const finished = !sheet.querySelector('[aria-current="step"]');
  const subject = sheet.classList.contains('lesson--count') || (finished && params.get('lesson') === 'count') ? 'count' : 'read';
  const games = paths[subject];
  const steps = Array.from(sheet.querySelectorAll('.path__step'));
  const illustrated = steps.findIndex(step => step.querySelector('[aria-current="step"]')) + 1;
  const resumable = sheet.querySelector('.path__node--done') && sheet.querySelector('.path__node:disabled');
  const current = finished ? 6 : resumable && /^[1-5]$/.test(params.get('current')) ? Number(params.get('current')) : illustrated;
  const prototypes = {
    done: sheet.querySelector('.path__node--done'),
    now: sheet.querySelector('.path__node--now'),
    later: sheet.querySelector('.path__node:disabled')
  };

  function gameHref(i) {
    const url = new URL('../' + games[i][1] + '.html', location.href);
    url.search = new URLSearchParams({ lesson: subject, current, game: i + 1, begin: 1 }).toString();
    return url.href;
  }
  if (finished && subject === 'count') {
    sheet.classList.replace('lesson--read', 'lesson--count');
    sheet.querySelector('.lesson__kicker').textContent = 'Counting lesson';
    sheet.querySelector('.lesson__title').textContent = 'Numbers up and down';
    sheet.querySelectorAll('a[href*="/home/"]').forEach(link => { link.href = '../home/counting.html'; });
  }
  steps.forEach((step, i) => {
    const n = i + 1;
    const state = n < current ? 'done' : n === current ? 'now' : 'later';
    const node = prototypes[state].cloneNode(true);
    if (node.tagName === 'A') node.href = gameHref(i);
    node.setAttribute('aria-label', n + '. ' + games[i][0] + ', ' + ({ now: 'play now', done: 'done', later: 'not yet' })[state]);
    step.querySelector('.path__node').replaceWith(node);
    const label = step.querySelector('.path__name');
    label.textContent = games[i][0];
    label.classList.toggle('path__name--later', state === 'later');
    step.querySelectorAll('.path__line').forEach((line, side) => {
      line.classList.toggle('path__line--done', !line.classList.contains('path__line--none') && (side === 0 ? n <= current : n < current));
    });
  });
  const returnGame = Number(params.get('focusGame'));
  if (Number.isInteger(returnGame) && returnGame >= 1 && returnGame <= Math.min(current, games.length)) {
    steps[returnGame - 1].querySelector('.path__node').focus();
    const url = new URL(location.href);
    url.searchParams.delete('focusGame');
    history.replaceState(history.state, '', url);
  }
  if (!finished) {
    sheet.querySelector('.lesson__next p').textContent = 'Up next: ' + games[current - 1][0];
    const play = sheet.querySelector('.lesson__foot a');
    play.textContent = 'Play game ' + current;
    play.href = gameHref(current - 1);
  }
  if (params.get('focus') === 'lessonAction') {
    sheet.querySelector('.lesson__foot a').focus();
    const url = new URL(location.href);
    url.searchParams.delete('focus');
    history.replaceState(history.state, '', url);
  }
})();
