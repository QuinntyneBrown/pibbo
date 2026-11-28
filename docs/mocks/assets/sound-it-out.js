// Carry the illustrated word through the sound tiles, blend and picture choices.
(function () {
  const samples = {
    map: ['sun', 'map', 'cat'],
    cape: ['cap', 'hat', 'cape'],
    sunset: ['sunset', 'night', 'sun']
  };
  const params = new URLSearchParams(location.hash.slice(1));
  const prompt = document.querySelector('.bubble__text');
  const blend = document.querySelector('.blend');
  const word = blend
    ? Array.from(document.querySelectorAll('.tile'), tile => tile.textContent).join('')
    : Object.hasOwn(samples, params.get('word')) ? params.get('word') : 'map';
  const attempts = Number(params.get('misses'));
  const misses = [1, 2].includes(attempts) ? attempts : 0;

  function buttonFrom(link) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = link.className;
    button.textContent = link.textContent;
    link.replaceWith(button);
    return button;
  }

  if (blend) {
    const tiles = Array.from(document.querySelectorAll('.tile'));
    const fill = blend.querySelector('.blend__fill');
    const control = blend.querySelector('button') || buttonFrom(blend.querySelector('a'));
    let heard = tiles.filter(tile => tile.classList.contains('tile--heard')).length;
    tiles.forEach((tile, index) => tile.addEventListener('click', () => {
      if (index !== heard) return;
      const sound = tile.nextElementSibling;
      tile.classList.remove('tile--next');
      tile.classList.add('tile--heard');
      tile.disabled = true;
      tile.setAttribute('aria-label', tile.textContent + ', ' + sound.textContent);
      sound.classList.remove('tiles__say--hidden');
      heard++;
      fill.style.width = (heard / tiles.length * 100) + '%';
      if (heard === tiles.length) {
        prompt.textContent = 'Now say the sounds fast to read the word.';
        control.disabled = false;
        control.focus();
      } else {
        const next = tiles[heard];
        next.disabled = false;
        next.classList.add('tile--next');
        next.setAttribute('aria-label', next.textContent + ', tap to hear it');
        next.focus();
      }
    }));
    control.addEventListener('click', () => {
      control.disabled = true;
      const link = document.querySelector('.mock-bar a[href="pick.html"]');
      link.hash = new URLSearchParams({ word }).toString();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { link.click(); return; }
      // Light each unit in reading order over the prototype's 520 ms blend.
      let index = 0;
      tiles[0].classList.add('tile--sounding');
      const timer = setInterval(() => {
        tiles[index].classList.remove('tile--sounding');
        index++;
        if (index < tiles.length) tiles[index].classList.add('tile--sounding');
        else { clearInterval(timer); link.click(); }
      }, 520 / tiles.length);
      window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
    });
    return;
  }

  const options = Array.from(document.querySelectorAll('.pick__option'));
  if (!options.length) return;
  if (word !== 'map') {
    const variant = document.getElementById('sounds-' + word).content.cloneNode(true);
    document.querySelector('.tiles').replaceWith(variant);
    prompt.textContent = 'Which picture is “' + word + '”?';
    const rightMark = document.querySelector('.pick__tick');
    const right = options[samples[word].indexOf(word)];
    if (rightMark) {
      rightMark.parentElement.classList.remove('pick__option--right');
      right.append(rightMark);
      right.classList.add('pick__option--right');
    }
    options.forEach((option, i) => {
      const picture = samples[word][i];
      option.setAttribute('aria-label', picture);
      option.querySelector('img').src = '../../assets/pictures/' + picture + '.jpg';
      if (document.querySelector('.answer-bar--correct')) option.setAttribute('aria-pressed', String(option === right));
    });
    const message = document.querySelector('.answer-bar__message');
    if (message) message.lastChild.textContent = message.lastChild.textContent.replace('“map”', '“' + word + '”');
  }
  const check = document.querySelector('[data-check-action]');
  if (check) {
    if (params.has('word')) {
      const button = buttonFrom(check);
      button.dataset.checkAction = '';
      button.disabled = true;
      options.forEach(option => option.setAttribute('aria-pressed', 'false'));
    }
    options.forEach((option, i) => {
      const correct = samples[word][i] === word;
      const state = correct ? 'correct.html' : misses === 2 ? 'modelled.html' : 'retry.html?choice=' + i;
      option.dataset.checkHref = state + '#' + new URLSearchParams({ word, misses: correct ? 0 : misses + 1 });
    });
  } else {
    const retry = document.querySelector('.answer-bar--retry a');
    if (retry) retry.hash = new URLSearchParams({ word, misses }).toString();
  }
})();
