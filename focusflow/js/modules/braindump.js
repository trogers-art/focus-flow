// js/modules/braindump.js
const BrainDump = (() => {
  const KEY = 'ff_braindump';
  let timer;

  function build(body) {
    const ta = document.createElement('textarea');
    ta.className = 'braindump-ta';
    ta.placeholder = 'Let it all out… stream of consciousness, no judgment.';
    ta.value = localStorage.getItem(KEY) || '';

    ta.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => localStorage.setItem(KEY, ta.value), 400);
    });

    const hint = document.createElement('div');
    hint.className = 'braindump-hint';
    hint.textContent = '✦ Auto-saved locally · Clear your mind here';

    body.append(ta, hint);
  }

  return { build };
})();
