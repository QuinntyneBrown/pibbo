// Preview the found words in the authored story and open its existing completion state.
(function () {
  const words = Array.from(document.querySelectorAll('.story__word'));
  const target = document.querySelector('.target-word').textContent.toLowerCase();
  const counter = document.querySelector('.found');
  const dots = Array.from(counter.children);
  let pending;
  let missed = document.querySelector('.story__word--miss');

  function clearMiss() {
    clearTimeout(pending);
    missed?.classList.remove('story__word--miss');
    missed = null;
  }

  if (missed) pending = setTimeout(clearMiss, 400);
  window.addEventListener('pagehide', clearMiss);

  for (const word of words) {
    word.addEventListener('click', () => {
      clearMiss();
      const label = word.textContent;
      if (label.toLowerCase().replace(/[.,!?]/g, '') !== target) {
        missed = word;
        missed.classList.add('story__word--miss');
        pending = setTimeout(clearMiss, 400);
        return;
      }
      word.disabled = true;
      word.classList.add('story__word--found');
      word.setAttribute('aria-label', label + ', found');
      const count = words.filter(item => item.classList.contains('story__word--found')).length;
      dots.forEach((dot, index) => dot.classList.toggle('found__dot--on', index < count));
      counter.setAttribute('aria-label', count + ' of ' + dots.length + ' found');
      if (count === dots.length) document.querySelector('.mock-bar a[href="correct.html"]').click();
    });
  }
})();
