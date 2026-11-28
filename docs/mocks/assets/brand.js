// Apply the Brand frame's review arguments to the primary lockup.
(function () {
  const lockup = document.querySelector('.brand__lockup');
  const hero = lockup.querySelector('.pibbo');
  const tagline = lockup.querySelector('.brand__tagline');
  const defaultTagline = tagline.textContent;
  const samples = Array.from(document.querySelectorAll('.moods [data-mood]'));

  function render() {
    const args = new URLSearchParams(location.hash.slice(1));
    const mood = samples.find(sample => sample.dataset.mood === args.get('heroMood'));
    const figure = mood ? mood.cloneNode(true) : hero;
    figure.setAttribute('class', hero.getAttribute('class'));
    lockup.querySelector('.pibbo').replaceWith(figure);
    tagline.textContent = args.get('tagline') ?? defaultTagline;
  }

  render();
  window.addEventListener('hashchange', render);
})();
