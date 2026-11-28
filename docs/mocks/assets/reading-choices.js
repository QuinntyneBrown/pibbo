// The mock supplies its word bank and target. A fragment carries bank positions to
// the corresponding feedback drawing, so the drawing reflects the reviewer's choice.
(function () {
  const board = document.querySelector('[data-reading-review]');
  const mode = board.dataset.readingReview;
  const sampleKey = mode === 'sentence' ? 'sentence' : 'word';
  const requested = new URLSearchParams(location.search).get(sampleKey);
  const samples = {
    spelling: {
      map: { bank: ['p', 'a', 'n', 'm', 'o', 's'], answer: 'm a p' },
      cat: { bank: ['t', 'h', 'a', 'c', 'u', 'b'], answer: 'c a t' }
    },
    sentence: {
      sun: { bank: ['the', 'sun.', 'I', 'map', 'see'], answer: 'I see the sun.', alt: 'The sun shining' },
      boat: { bank: ['is', 'The', 'big.', 'boat', 'sat'], answer: 'The boat is big.', alt: 'A big boat' }
    }
  };
  const sample = samples[mode] && Object.hasOwn(samples[mode], requested) ? samples[mode][requested] : null;
  const target = (sample ? sample.answer : board.dataset.answer).split(' ');
  const isFeedback = Boolean(document.querySelector('.answer-bar[role="status"]'));
  const selector = { spelling: '.bank__letter', rhymes: '.word-card', sentence: '.word-tile' }[mode];
  const bank = Array.from(board.querySelectorAll(selector));
  if (sample) {
    bank.forEach((button, i) => { button.textContent = sample.bank[i]; });
    const picture = board.querySelector('.frame-picture img');
    picture.src = '../../assets/pictures/' + requested + '.jpg';
    picture.alt = sample.alt || requested;
    const praise = document.querySelector('.answer-bar--correct .answer-bar__message');
    if (praise) {
      praise.lastChild.textContent = mode === 'sentence'
        ? '“' + sample.answer + '” What a great sentence!'
        : target.join(' – ') + '. You spelled “' + requested + '”!';
    }
    for (const link of document.querySelectorAll('.mock-bar__states a, .answer-bar--retry a')) {
      const url = new URL(link.href);
      url.searchParams.set(sampleKey, requested);
      link.href = url.href;
    }
  }
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
    selected = placed.filter(item => item.textContent.trim()).map((item, i) => {
      if (!sample) return labels.indexOf(item.textContent.trim());
      const miss = document.querySelector('.answer-bar--retry') && i === target.length - 1;
      return miss ? labels.findIndex(letter => !target.includes(letter)) : labels.indexOf(target[i]);
    });
  }
  if (isFeedback && params.has('answer')) {
    const parts = params.get('answer').split('.');
    const validLength = mode === 'spelling' ? parts.length === boxes.length : parts.length <= bank.length;
    const valid = validLength && parts.every(v => /^\d+$/.test(v) && Number(v) < bank.length);
    if (valid && (mode === 'spelling' || new Set(parts).size === parts.length)) selected = parts.map(Number);
  } else if (!isFeedback && new URLSearchParams(location.search).get('reset') === '1') {
    selected = [];
  }

  if (mode === 'sentence' && !isFeedback) {
    const query = new URLSearchParams(location.search);
    const placed = query.get('placed');
    if (query.get('reset') !== '1' && /^[0-5]$/.test(placed)) {
      selected = target.slice(0, Number(placed)).map(word => labels.indexOf(word));
    }
  }
  if (mode === 'rhymes' && !isFeedback) {
    const chosen = new URLSearchParams(location.search).get('chosen');
    if (chosen !== null) {
      const words = chosen.trim() ? chosen.trim().split(/\s+/) : [];
      if (words.every(word => labels.includes(word))) selected = [...new Set(words)].map(word => labels.indexOf(word));
    }
  }
  if (mode === 'spelling') {
    const filled = new URLSearchParams(location.search).get('filled');
    if (!isFeedback && filled !== null) {
      const letters = Array.from(filled).slice(0, boxes.length);
      if (letters.every(letter => labels.includes(letter))) selected = letters.map(letter => labels.indexOf(letter));
    } else if (!isFeedback && new URLSearchParams(location.search).get('begin') === '1') {
      selected = [];
    }
    let activeCue;
    let cueTimer;
    function clearCue() {
      clearTimeout(cueTimer);
      activeCue?.remove();
      activeCue = null;
    }
    function showCue(host, block, phoneme) {
      clearCue();
      activeCue = document.createElement('span');
      activeCue.className = block + '__sound';
      activeCue.setAttribute('aria-hidden', 'true');
      activeCue.textContent = phoneme;
      host.append(activeCue);
      cueTimer = setTimeout(clearCue, 900);
    }
    board.querySelectorAll('.boxes__unit .speaker').forEach((speaker, i) => {
      const phoneme = '/' + (target[i] === 'c' ? 'k' : target[i]) + '/';
      speaker.setAttribute('aria-label', 'Hear sound ' + (i + 1) + ', ' + phoneme);
      speaker.addEventListener('click', () => showCue(speaker, 'speaker', phoneme));
    });
    // An empty box says the sound that belongs there too (L2-013 #3), so a phone that hides the speakers still offers it.
    boxes.forEach((box, i) => box.addEventListener('click', () => {
      if (i >= selected.length) showCue(box, 'box', '/' + (target[i] === 'c' ? 'k' : target[i]) + '/');
    }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearCue(); });
    window.addEventListener('pagehide', clearCue);
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
      box.disabled = isFeedback;
      box.classList.toggle('box--filled', filled);
      box.classList.toggle('box--next', !filled && i === selected.length);
      box.setAttribute('aria-label', filled ? (isFeedback ? 'Sound ' + (i + 1) + ', ' + box.textContent : 'Remove ' + box.textContent) : 'Empty box for sound ' + (i + 1) + (isFeedback ? '' : ', hear it'));
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
      word.setAttribute('aria-label', isFeedback ? labels[index] : 'Take back ' + labels[index]);
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
    const query = sample ? '?' + sampleKey + '=' + requested : '';
    check.dataset.mockHref = correct ? 'correct.html' + query : 'retry.html' + query + '#answer=' + selected.join('.');
  }

  if (!isFeedback) {
    boxes.forEach((box, i) => box.addEventListener('click', event => {
      if (i >= selected.length) return;
      const removed = selected[i];
      selected.splice(i);
      draw();
      if (event.detail === 0) bank[removed].focus();
    }));
    bank.forEach((button, i) => button.addEventListener('click', event => {
      const position = selected.indexOf(i);
      if (mode === 'rhymes' && position >= 0) selected.splice(position, 1);
      else selected.push(i);
      draw();
      if (event.detail !== 0 || !button.disabled) return;
      if (check && !check.disabled) check.focus();
      else {
        const next = bank.slice(i + 1).find(item => !item.disabled) || bank.find(item => !item.disabled);
        if (next) next.focus();
        else strip?.lastElementChild?.focus();
      }
    }));
  }
  draw();

  const feedbackAction = document.querySelector('.answer-bar[role="status"] a');
  const retry = document.querySelector('.answer-bar--retry a');
  if (check) {
    check.addEventListener('click', event => {
      const url = new URL(check.dataset.mockHref, location.href);
      if (event.detail === 0) url.searchParams.set('focus', 'feedback');
      else url.searchParams.delete('focus');
      check.dataset.mockHref = url.href;
    });
  }
  if (retry) {
    retry.addEventListener('click', event => {
      const url = new URL(retry.href);
      if (event.detail === 0) url.searchParams.set('focus', 'choices');
      else url.searchParams.delete('focus');
      retry.href = url.href;
    });
  }
  const focus = new URLSearchParams(location.search).get('focus');
  if (focus === 'feedback') feedbackAction?.focus();
  if (focus === 'choices') bank.find(button => !button.disabled)?.focus();
})();
