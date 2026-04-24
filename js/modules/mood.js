// js/modules/mood.js
const Mood = (() => {
  const MOODS = [
    { e: '😫', l: 'Overwhelmed' }, { e: '😔', l: 'Low' },
    { e: '😐', l: 'Neutral'     }, { e: '🌿', l: 'Calm' },
    { e: '⚡', l: 'Energized'  }, { e: '✨', l: 'Joyful' },
  ];

  function build(body) {
    const row = document.createElement('div');
    row.className = 'mood-row';
    MOODS.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mood-btn' + (State.get().selectedMood === m.e ? ' selected' : '');
      btn.textContent = m.e;
      btn.title = m.l;
      btn.addEventListener('click', () => {
        State.set('selectedMood', m.e);
        row.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.textContent === m.e));
      });
      row.appendChild(btn);
    });

    const note = document.createElement('textarea');
    note.className = 'mood-note';
    note.rows = 2;
    note.placeholder = 'Any thoughts?';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mood-save';
    saveBtn.textContent = 'Log Mood';

    const hist = document.createElement('div');
    hist.className = 'mood-history';

    saveBtn.addEventListener('click', () => {
      const s = State.get();
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      s.moodHistory.unshift({ mood: s.selectedMood, note: note.value.trim(), time: now });
      if (s.moodHistory.length > 20) s.moodHistory.pop();
      State.save();
      note.value = '';
      renderHist(hist);
    });

    body.append(row, note, saveBtn, hist);
    renderHist(hist);
  }

  function renderHist(el) {
    const history = State.get().moodHistory.slice(0, 5);
    el.innerHTML = history.map(e =>
      `<div class="mood-entry">
        <span>${e.mood || '—'}</span>
        <span style="color:var(--accent);font-family:'Cinzel',serif">${e.time}</span>
        ${e.note ? `<span>${e.note.slice(0,30)}</span>` : ''}
      </div>`
    ).join('');
  }

  return { build };
})();
