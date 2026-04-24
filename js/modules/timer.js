// js/modules/timer.js
const Timer = (() => {
  const CIRC = 2 * Math.PI * 52;
  let secs = 25 * 60, total = 25 * 60, phase = 'focus';
  let running = false, interval = null;
  let progEl, timeEl, phaseEl, playBtn;

  const PRESETS = [
    { label: 'Pomodoro 25', mins: 25, phase: 'focus' },
    { label: 'Deep 50',     mins: 50, phase: 'deep'  },
    { label: 'Break 5',     mins: 5,  phase: 'break' },
    { label: 'Break 15',    mins: 15, phase: 'break' },
  ];

  function build(body) {
    body.innerHTML = `
      <div class="timer-wrap">
        <svg class="timer-svg" viewBox="0 0 120 120" width="150" height="150">
          <circle class="timer-ring-bg" cx="60" cy="60" r="52"/>
          <circle class="timer-ring-prog" id="t-prog" cx="60" cy="60" r="52"
            stroke-dasharray="${CIRC}" stroke-dashoffset="0" transform="rotate(-90 60 60)"/>
          <text class="timer-digits" id="t-digits" x="60" y="63" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.92)">25:00</text>
          <text class="timer-phase" id="t-phase" x="60" y="80" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.45)" font-size="8" letter-spacing="2">FOCUS</text>
        </svg>
      </div>
      <div class="timer-presets" id="t-presets"></div>
      <div class="timer-controls">
        <button class="ctrl-btn" id="t-reset">↺ Reset</button>
        <button class="ctrl-btn primary" id="t-play">▶ Start</button>
      </div>
    `;

    progEl  = body.querySelector('#t-prog');
    timeEl  = body.querySelector('#t-digits');
    phaseEl = body.querySelector('#t-phase');
    playBtn = body.querySelector('#t-play');

    // Presets
    const presetsEl = body.querySelector('#t-presets');
    PRESETS.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn' + (idx === 0 ? ' active' : '');
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        stop();
        secs = total = p.mins * 60;
        phase = p.phase;
        presetsEl.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateDisplay();
        playBtn.textContent = '▶ Start';
      });
      presetsEl.appendChild(btn);
    });

    body.querySelector('#t-reset').addEventListener('click', () => {
      stop(); secs = total; updateDisplay(); playBtn.textContent = '▶ Start';
    });

    playBtn.addEventListener('click', () => {
      if (running) { stop(); playBtn.textContent = '▶ Start'; }
      else         { start(); playBtn.textContent = '⏸ Pause'; }
    });

    updateDisplay();
  }

  function start() {
    running = true;
    interval = setInterval(() => {
      if (secs <= 0) { stop(); bell(); return; }
      secs--;
      updateDisplay();
    }, 1000);
  }

  function stop() {
    running = false;
    clearInterval(interval);
  }

  function updateDisplay() {
    if (!timeEl) return;
    const m = Math.floor(secs / 60), s = secs % 60;
    timeEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    phaseEl.textContent = phase === 'break' ? 'BREAK' : phase === 'deep' ? 'DEEP WORK' : 'FOCUS';
    const pct = secs / total;
    progEl.style.strokeDashoffset = CIRC * (1 - pct);
    progEl.style.stroke = phase === 'break' ? 'var(--accent2)' : 'var(--accent)';
  }

  function bell() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      o.start(); o.stop(ctx.currentTime + 1.5);
    } catch(e) {}
  }

  return { build };
})();
