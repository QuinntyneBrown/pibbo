// Carry the illustrated word through the sound tiles, blend and picture choices.
(function () {
  const samples = {
    map: ['cap', 'map', 'sun'],
    ship: ['boat', 'sun', 'ship'],
    stop: ['stop', 'ship', 'map'],
    night: ['sunset', 'sun', 'night'],
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
  const soundPatterns = {
    ship: { glyph: 'sh', rule: 'Two letters, one sound', units: ['sh', 'i', 'p'], sounds: ['/sh/', '/i/', '/p/'] },
    stop: { glyph: 's + t', rule: 'Say both sounds, quickly', units: ['s', 't', 'o', 'p'], sounds: ['/s/', '/t/', '/o/', '/p/'], firstTwo: true },
    night: { glyph: 'igh', rule: 'Three letters, one sound: /ī/', units: ['n', 'igh', 't'], sounds: ['/n/', '/ī/', '/t/'] },
    boat: { glyph: 'oa', rule: 'Two vowels team up to say /ō/', units: ['b', 'oa', 't'], sounds: ['/b/', '/ō/', '/t/'] }
  };
  const requested = params.get('word') || route.get('word');
  const word = blend
    ? (illustrated === 'map' ? (Object.hasOwn(soundPatterns, requested) ? requested : lessonWord || 'map') : illustrated)
    : Object.hasOwn(samples, requested) ? requested : lessonWord || 'map';
  const attempts = Number(params.get('misses'));
  const misses = [1, 2].includes(attempts) ? attempts : 0;

  function buttonFrom(link) {
    if (link.tagName === 'BUTTON') return link;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = link.className;
    button.textContent = link.textContent;
    link.replaceWith(button);
    return button;
  }

  // A tile is named by its letters and its state: heard (with its sound), next, or waiting.
  function labelTile(tile) {
    const sound = tile.nextElementSibling.textContent;
    const letters = tile.textContent;
    tile.setAttribute('aria-label', tile.classList.contains('tile--heard')
      ? letters + (sound.startsWith('/') ? ', says ' : ', ') + sound
      : tile.classList.contains('tile--next') ? letters + ', tap to hear it' : letters);
  }
  // Syllables are clapped one at a time; other words are sounded part by part.
  function promptFor(next) {
    const rule = document.querySelector('.rule__glyph');
    return rule && rule.textContent.includes('·') ? 'Tap “' + next.textContent + '” and clap it.' : null;
  }

  const pattern = soundPatterns[word];
  if (pattern) {
    const rule = document.createElement('p');
    rule.className = 'rule';
    const glyph = document.createElement('span');
    glyph.className = 'rule__glyph';
    glyph.textContent = pattern.glyph;
    rule.append(glyph, ' ' + pattern.rule);
    const group = document.querySelector('.tiles');
    if (!document.querySelector('.rule')) group.before(rule);
    group.classList.toggle('tiles--long', pattern.units.length > 3);
    while (group.children.length < pattern.units.length) {
      group.append(group.lastElementChild.cloneNode(true));
    }
    if (blend && group.querySelector('.tile--next') && pattern.units.some(unit => unit.length > 1)) {
      prompt.textContent = 'Tap each part and say its sound.';
    }
    document.querySelectorAll('.tile').forEach((tile, i) => {
      tile.textContent = pattern.units[i];
      tile.classList.toggle('tile--wide', pattern.units[i].length > 1);
      tile.nextElementSibling.textContent = pattern.sounds[i];
      labelTile(tile);
    });
    document.querySelectorAll('.mock-bar a[href]').forEach(link => {
      const url = new URL(link.href);
      if (illustrated !== word && new URL('.', url).href === new URL('.', location.href).href &&
          !/(magic-e|syllables)\.html$/.test(url.pathname)) {
        link.addEventListener('click', () => {
          const state = new URLSearchParams(link.hash.slice(1));
          state.set('word', word);
          link.hash = state.toString();
        });
      }
    });
  }
  if (blend) {
    const stage = blend.closest('.stage');
    stage.classList.add('stage--initial-sounds');
    // The quiet e makes no sound of its own: touching it adds it or takes it away (L2-016).
    const tiles = Array.from(document.querySelectorAll('.tile:not(.tile--silent)'));
    const quietE = document.querySelector('.tile--silent[aria-pressed]');
    if (quietE) quietE.addEventListener('click', () => {
      location.href = quietE.getAttribute('aria-pressed') === 'true' ? 'magic-e.html' : 'magic-e-on.html';
    });
    const fill = blend.querySelector('.blend__fill');
    const control = blend.querySelector('button') || buttonFrom(blend.querySelector('a'));
    if (route.get('begin') === '1') {
      tiles.forEach((tile, i) => {
        tile.disabled = i !== 0;
        tile.classList.remove('tile--heard', 'tile--sounding');
        tile.classList.toggle('tile--next', i === 0);
        tile.nextElementSibling.classList.add('tiles__say--hidden');
        labelTile(tile);
      });
      prompt.textContent = promptFor(tiles[0]) || prompt.textContent;
    }
    // A longer word is read one clap at a time (L2-017). `?begin=1` shows the round as it opens.
    const claps = location.pathname.endsWith('/syllables.html');
    const askClap = tile => 'Tap \u201c' + tile.textContent + '\u201d and clap it.';
    if (claps && route.get('begin') === '1') {
      tiles.forEach((tile, i) => {
        tile.disabled = i !== 0;
        tile.setAttribute('aria-label', tile.textContent + (i === 0 ? ', tap to hear it' : ''));
        tile.classList.remove('tile--heard');
        tile.classList.toggle('tile--next', i === 0);
        tile.nextElementSibling.classList.add('tiles__say--hidden');
      });
      prompt.textContent = askClap(tiles[0]);
    }
    let heard = tiles.filter(tile => tile.classList.contains('tile--heard')).length;
    function updateBlendProgress() {
      fill.style.width = (heard / tiles.length * 100) + '%';
      const bar = fill.parentElement;
      bar.setAttribute('aria-valuemax', tiles.length);
      bar.setAttribute('aria-valuenow', heard);
      bar.setAttribute('aria-label', heard + ' of ' + tiles.length + ' parts explored');
    }
    updateBlendProgress();
    tiles.forEach((tile, index) => tile.addEventListener('click', () => {
      if (index !== heard) return;
      stage.classList.remove('stage--initial-sounds');
      const sound = tile.nextElementSibling;
      tile.classList.remove('tile--next');
      tile.classList.add('tile--heard');
      tile.disabled = true;
      tile.setAttribute('aria-label', tile.textContent + (claps ? ', says ' : ', ') + sound.textContent);
      sound.classList.remove('tiles__say--hidden');
      heard++;
      updateBlendProgress();
      if (heard === tiles.length) {
        prompt.textContent = 'Now say the sounds fast to read the word.';
        control.disabled = false;
        control.focus();
      } else {
        const next = tiles[heard];
        next.disabled = false;
        next.classList.add('tile--next');
        labelTile(next);
        prompt.textContent = promptFor(next) || prompt.textContent;
        next.focus();
        if (claps) prompt.textContent = askClap(next);
      }
    }));
    // Two consonants side by side ask for the first two sounds before the pictures (L2-015).
    const link = document.querySelector('.mock-bar a[href="' + (pattern && pattern.firstTwo ? 'first-two.html' : 'pick.html') + '"]');
    control.addEventListener('click', event => {
      control.disabled = true;
      const state = new URLSearchParams({ word });
      if (event.detail === 0) state.set('focus', 'pictures');
      link.hash = state.toString();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { link.click(); return; }
      // Light each unit in reading order over the prototype's 520 ms blend.
      let index = 0;
      tiles[0].classList.add('tile--sounding');
      const timer = setInterval(() => {
        tiles[index].classList.remove('tile--sounding');
        index++;
        if (index < tiles.length) tiles[index].classList.add('tile--sounding');
        else {
          stopBlend();
          link.click();
        }
      }, 520 / tiles.length);
      function stopBlend() {
        clearInterval(timer);
        tiles.forEach(tile => tile.classList.remove('tile--sounding'));
        control.disabled = false;
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', stopBlend);
      }
      function onVisibility() {
        if (document.hidden) stopBlend();
      }
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', stopBlend, { once: true });
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
    if (document.querySelector('.answer-bar--retry') && right.getAttribute('aria-pressed') === 'true') {
      right.setAttribute('aria-pressed', 'false');
      options.find(option => option !== right).setAttribute('aria-pressed', 'true');
    }
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
    if (params.get('focus') === 'pictures') options[0].focus();
  } else {
    const retry = document.querySelector('.answer-bar--retry a');
    if (retry) {
      retry.hash = new URLSearchParams({ word, misses }).toString();
      retry.addEventListener('click', event => {
        const state = new URLSearchParams({ word, misses });
        if (event.detail === 0) state.set('focus', 'pictures');
        retry.hash = state.toString();
      });
    }
  }
})();
