// js/modules/quote.js
const Quote = (() => {
  let textEl, authorEl, editSection, displaySection;

  function build(body) {
    body.innerHTML = `
      <div class="quote-display" id="q-display">
        <div class="quote-text" id="q-text"></div>
        <div class="quote-author" id="q-author"></div>
        <div class="quote-nav">
          <button class="tb-btn" id="q-prev">← Prev</button>
          <button class="tb-btn" id="q-next">Next →</button>
          <button class="tb-btn" id="q-edit">✏ Edit</button>
        </div>
      </div>
      <div class="quote-edit-form" id="q-edit-form" style="display:none">
        <textarea id="q-ta" rows="3" placeholder="Enter your mantra…"></textarea>
        <input id="q-auth" placeholder="— Author (optional)">
        <button class="add-btn" id="q-save">Save Quote</button>
      </div>
    `;

    textEl        = body.querySelector('#q-text');
    authorEl      = body.querySelector('#q-author');
    editSection   = body.querySelector('#q-edit-form');
    displaySection = body.querySelector('#q-display');

    body.querySelector('#q-prev').addEventListener('click', () => {
      const s = State.get();
      State.set('quoteIdx', (s.quoteIdx - 1 + s.quotes.length) % s.quotes.length);
      render();
    });
    body.querySelector('#q-next').addEventListener('click', () => {
      const s = State.get();
      State.set('quoteIdx', (s.quoteIdx + 1) % s.quotes.length);
      render();
    });
    body.querySelector('#q-edit').addEventListener('click', () => {
      displaySection.style.display = 'none';
      editSection.style.display = 'flex';
      editSection.style.flexDirection = 'column';
    });
    body.querySelector('#q-save').addEventListener('click', () => {
      const text = body.querySelector('#q-ta').value.trim();
      const auth = body.querySelector('#q-auth').value.trim();
      if (!text) return;
      const s = State.get();
      s.quotes.push({ text, author: auth });
      State.set('quoteIdx', s.quotes.length - 1);
      State.save();
      displaySection.style.display = 'block';
      editSection.style.display = 'none';
      render();
    });

    render();
  }

  function render() {
    if (!textEl) return;
    const s = State.get();
    const q = s.quotes[s.quoteIdx % s.quotes.length];
    textEl.textContent   = '\u201c' + q.text + '\u201d';
    authorEl.textContent = q.author ? '\u2014 ' + q.author : '';
  }

  return { build };
})();
