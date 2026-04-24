// js/modules/focusword.js
const FocusWord = (() => {
  function build(body) {
    body.style.textAlign = 'center';
    body.style.padding = '18px 14px';

    const word = document.createElement('div');
    word.className = 'fw-word';
    word.textContent = State.get().focusWord || 'PRESENT';

    const input = document.createElement('input');
    input.className = 'fw-input';
    input.maxLength = 20;
    input.value = State.get().focusWord || 'PRESENT';
    input.placeholder = 'Your focus word…';

    input.addEventListener('input', () => {
      const v = input.value.toUpperCase();
      word.textContent = v || 'PRESENT';
      State.set('focusWord', v);
    });

    const hint = document.createElement('div');
    hint.className = 'fw-hint';
    hint.textContent = 'Set your intention for this session';

    body.append(word, input, hint);
  }

  return { build };
})();
