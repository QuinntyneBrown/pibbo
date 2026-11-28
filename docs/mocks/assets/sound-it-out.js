// Carry the illustrated word through the sound tiles, blend and picture choices.
(function () {
  const samples = {
    map: ['sun', 'map', 'cat'],
    ship: ['boat', 'sun', 'ship'],
    boat: ['ship', 'boat', 'bat'],
    cape: ['cap', 'hat', 'cape'],
    sunset: ['sunset', 'night', 'sun']
  };
  const params = new URLSearchParams(location.hash.slice(1));
  const prompt = document.querySelector('.bubble__text');
  const blend = document.querySelector('.blend');
  const route = new URLSearchParams(location.search);
  const lessonWord = route.get('lesson') === 'read' && ['2', '3'].includes(route.get('game'))
    ? (route.get('game') === '3' ? 'ship' : 'map') : null;
  const illustrated = Array.from(document.querySelectorAll('.tile'), tile => tile.textContent).join('');
  const teams = {
    ship: { glyph: 'sh', rule: 'Two letters, one sound', units: ['sh', 'i', 'p'], sounds: ['/sh/', '/i/', '/p/'] },
    boat: { glyph: 'oa', rule: 'Two vowels team up to say /ō/', units: ['b', 'oa', 't'], sounds: ['/b/', '/ō/', '/t/'] }
  };
  const requested = params.get('word') || route.get('word');
  const word = blend
    ? (illustrated === 'map' ? (Object.hasOwn(teams, requested) ? requested : lessonWord || 'map') : illustrated)
    : Object.hasOwn(samples, requested) ? requested : lessonWord || 'map';
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

  const team = teams[word];
  if (team) {
    const rule = document.createElement('p');
    rule.className = 'rule';
    const glyph = document.createElement('span');
    glyph.className = 'rule__glyph';
    glyph.textContent = team.glyph;
    rule.append(glyph, ' ' + team.rule);
    document.querySelector('.tiles').before(rule);
    document.querySelectorAll('.tile').forEach((tile, i) => {
      tile.textContent = team.units[i];
      tile.classList.toggle('tile--wide', team.units[i].length > 1);
      tile.nextElementSibling.textContent = team.sounds[i];
      tile.setAttribute('aria-label', team.units[i] + ', says ' + team.sounds[i]);
    });
    document.querySelectorAll('.mock-bar a[href]').forEach(link => {
      const url = new URL(link.href);
      if (new URL('.', url).href === new URL('.', location.href).href &&
          !/(magic-e|syllables)\.html$/.test(url.pathname)) {
        link.addEventListener('click', () => { link.hash = new URLSearchParams({ word }).toString(); });
      }
    });
  }
  if (blend) {
    const tiles = Array.from(document.querySelectorAll('.tile'));
    const fill = blend.querySelector('.blend__fill');
    const control = blend.querySelector('button') || buttonFrom(blend.querySelector('a'));
    if (route.get('begin') === '1' && location.pathname.endsWith('/default.html')) {
      tiles.forEach((tile, i) => {
        tile.disabled = i !== 0;
        tile.setAttribute('aria-label', tile.textContent + (i === 0 ? ', tap to hear it' : ''));
        tile.classList.remove('tile--heard', 'tile--sounding');
        tile.classList.toggle('tile--next', i === 0);
        tile.nextElementSibling.classList.add('tiles__say--hidden');
      });
      fill.style.width = '0%';
    }
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
    const template = document.getElementById('sounds-' + word);
    if (template) document.querySelector('.tiles').replaceWith(template.content.cloneNode(true));
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
    if (params.has('word') || word !== 'map') {
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
