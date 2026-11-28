// The mock supplies its word bank and target. A fragment carries bank positions to
// the corresponding feedback drawing, so the drawing reflects the reviewer's choice.
(function () {
  const board = document.querySelector('[data-reading-review]');
  const mode = board.dataset.readingReview;
  const target = board.dataset.answer.split(' ');
  const isFeedback = Boolean(document.querySelector('.answer-bar[role="status"]'));
  const selector = { spelling: '.bank__letter', rhymes: '.word-card', sentence: '.word-tile' }[mode];
  const bank = Array.from(board.querySelectorAll(selector));
  const labels = bank.map(button => (button.querySelector('.word-card__word') || button).textContent.trim());
  const boxes = Array.from(board.querySelectorAll('.box'));
  const strip = board.querySelector('.strip');
  const prompt = document.querySelector('.bubble__text');
  const params = new URLSearchParams(location.hash.slice(1));
  let selected;

  if (mode === 'rhymes') {
    selected = bank.flatMap((button, i) => button.getAttribute('aria-pressed') === 'true' ? [i] : []);
  } else {
    const placed = strip ? Array.from(strip.querySelectorAll('.strip__word')) : boxes;
    selected = placed.filter(item => item.textContent.trim()).map(item => labels.indexOf(item.textContent.trim()));
  }
  if (isFeedback && params.has('answer')) {
    const parts = params.get('answer').split('.');
    const valid = parts.length <= bank.length && parts.every(v => /^\d+$/.test(v) && Number(v) < bank.length);
    if (valid && (mode === 'spelling' || new Set(parts).size === parts.length)) selected = parts.map(Number);
  } else if (!isFeedback && new URLSearchParams(location.search).get('reset') === '1') {
    selected = [];
  }

  const originalCheck = document.querySelector('.answer-bar--check .chunky');
  let check = originalCheck;
  if (originalCheck?.tagName === 'A') {
    check = document.createElement('button');
    check.type = 'button';
    check.className = originalCheck.className;
    check.textContent = originalCheck.textContent;
    originalCheck.replaceWith(check);
  }

  function drawSpelling() {
    boxes.forEach((box, i) => {
      const filled = i < selected.length;
      box.textContent = filled ? labels[selected[i]] : '';
      box.disabled = isFeedback || !filled;
      box.classList.toggle('box--filled', filled);
      box.classList.toggle('box--next', !filled && i === selected.length);
      box.setAttribute('aria-label', filled ? 'Remove ' + box.textContent : 'Empty box for sound ' + (i + 1));
    });
    bank.forEach(button => { button.disabled = isFeedback || selected.length === boxes.length; });
    prompt.textContent = selected.length === boxes.length ? 'Does it say the word? Check it!' : 'Listen: “' + target.join('') + '.” Pick a letter for each sound.';
  }

  function drawSentence() {
    strip.replaceChildren();
    if (!selected.length) {
      const hint = document.createElement('span');
      hint.className = 'strip__hint';
      hint.textContent = 'Tap words to build your sentence';
      strip.append(hint);
    }
    selected.forEach((index, position) => {
      const word = document.createElement('button');
      word.type = 'button';
      word.className = 'strip__word';
      word.textContent = labels[index];
      word.disabled = isFeedback;
      word.setAttribute('aria-label', 'Take back ' + labels[index]);
      word.addEventListener('click', () => {
        selected.splice(position, 1);
        draw();
        bank[index].focus();
      });
      strip.append(word);
    });
    bank.forEach((button, i) => {
      const used = selected.includes(i);
      button.classList.toggle('word-tile--used', used);
      button.disabled = isFeedback || used;
      button.setAttribute('aria-label', used ? labels[i] + ', used' : labels[i]);
    });
  }

  function drawRhymes() {
    bank.forEach((button, i) => button.setAttribute('aria-pressed', String(selected.includes(i))));
  }

  function draw() {
    if (mode === 'spelling') drawSpelling();
    else if (mode === 'sentence') drawSentence();
    else drawRhymes();
    if (!check) return;
    const words = selected.map(i => labels[i]);
    check.disabled = mode === 'rhymes' ? words.length === 0 : words.length !== target.length;
    const correct = words.length === target.length && (mode === 'rhymes'
      ? target.every(word => words.includes(word))
      : target.every((word, i) => words[i] === word));
    check.dataset.mockHref = correct ? 'correct.html' : 'retry.html#answer=' + selected.join('.');
  }

  if (!isFeedback) {
    boxes.forEach((box, i) => box.addEventListener('click', () => {
      selected.splice(i);
      draw();
    }));
    bank.forEach((button, i) => button.addEventListener('click', () => {
      const position = selected.indexOf(i);
      if (mode === 'rhymes' && position >= 0) selected.splice(position, 1);
      else selected.push(i);
      draw();
    }));
  }
  draw();
})();
