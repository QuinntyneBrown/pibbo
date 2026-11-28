// A speaker tap always starts one fresh demonstration, including after returning to the tab.
function bindCountingHint(length, showStep, finish, autoplay) {
  let timer;
  function stop() {
    clearTimeout(timer);
  }
  function replay() {
    stop();
    if (document.hidden) return;
    let index = 0;
    function advance() {
      if (document.hidden) return;
      if (index === length) {
        finish();
        return;
      }
      showStep(index++);
      timer = setTimeout(advance, 700);
    }
    advance();
  }
  document.querySelector('.bubble .hear').addEventListener('click', replay);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  if (autoplay) replay();
}
