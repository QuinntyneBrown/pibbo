// What do I know?: touching a choice selects it (the product speaks it), and Check leads to
// the right state: Yes! for the right answer, a hint and another go for any other.
(function () {
  const stage = document.querySelector('.stage--question');
  if (!stage) return;
  const answer = stage.dataset.answer;
  const options = Array.from(stage.querySelectorAll('.pick__option:not([disabled])'));
  const check = document.querySelector('[data-check-action]');
  options.forEach((button) => {
    button.addEventListener('click', () => {
      options.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      if (!check) return;
      const href = button.dataset.option === answer ? 'correct.html' : 'retry.html';
      if (check.tagName === 'A') check.href = href;
      else {
        check.disabled = false;
        check.dataset.mockHref = href;
      }
    });
  });
})();
