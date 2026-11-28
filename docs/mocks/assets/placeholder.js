// The temporary screen uses the same activity name, picture and return group as Home.
(function () {
  const reading = new URLSearchParams(location.search).get('activity') === 'sound-it-out';
  const activity = reading ? 'sound-it-out' : 'count-the-toys';
  const home = document.querySelector('.placeholder__home');
  if (reading) {
    document.querySelector('.placeholder').classList.add('placeholder--read');
    document.querySelector('.placeholder__title').textContent = 'Sound it out';
    document.querySelector('.placeholder__glyph').textContent = 'map';
    home.href = '../home/default.html';
    document.querySelector('.mock-bar__states [aria-current]').href = '?activity=sound-it-out';
  }
  const group = home.href;
  home.addEventListener('click', event => {
    const url = new URL(group);
    if (event.detail === 0) url.searchParams.set('homeFocus', activity);
    home.href = url.href;
  });
})();
