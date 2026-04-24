// js/background.js
const Background = (() => {
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx    = bgCanvas.getContext('2d');
  const wCanvas  = document.getElementById('witchy-canvas');
  const wCtx     = wCanvas.getContext('2d');

  const CONFIGS = {
    forest: { palette: ['#0d2e1a','#1a4d2a','#0a1f10'], particles: true,  pColor: '#88ff99', stars: false },
    ocean:  { palette: ['#071e3d','#1a4a6b','#0a2540'], particles: true,  pColor: '#4dd0e1', stars: false },
    rain:   { palette: ['#111827','#1f2937','#0f172a'], particles: true,  pColor: '#90caf9', rain: true,  stars: false },
    fire:   { palette: ['#1a0500','#2d0a00','#1a0500'], particles: true,  pColor: '#ff6b35', fire: true,  stars: false },
    space:  { palette: ['#030014','#0a0028','#050018'], particles: false, stars: true  },
    witchy: { type: 'witchy' },
  };

  let particles = [], stars = [];
  let bgFrame, wFrame, tick = 0;
  let witchyParts = [];

  function resize() {
    bgCanvas.width  = wCanvas.width  = window.innerWidth;
    bgCanvas.height = wCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ── stars ──
  function initStars() {
    stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.006,
    }));
  }
  function drawStars() {
    stars.forEach(s => {
      s.a = Math.max(0.1, Math.min(1, s.a + s.da));
      if (s.a <= 0.1 || s.a >= 1) s.da *= -1;
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${s.a})`;
      bgCtx.fill();
    });
  }

  // ── particles ──
  function initParticles(cfg) {
    particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: cfg.rain ? Math.random() * 3 + 2 : (Math.random() - 0.5) * 0.3 - (cfg.fire ? 1.5 : 0),
      a: Math.random() * 0.6 + 0.2,
      len: cfg.rain ? Math.random() * 14 + 8 : 0,
    }));
  }

  function animateBG(cfg) {
    bgFrame = requestAnimationFrame(() => animateBG(cfg));
    tick++;
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    const grad = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
    grad.addColorStop(0, cfg.palette[0]);
    grad.addColorStop(0.5, cfg.palette[1]);
    grad.addColorStop(1, cfg.palette[2]);
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (cfg.stars) drawStars();

    if (cfg.particles) {
      particles.forEach(p => {
        if (cfg.rain) {
          bgCtx.beginPath();
          bgCtx.moveTo(p.x, p.y);
          bgCtx.lineTo(p.x - 1, p.y - p.len);
          bgCtx.strokeStyle = `rgba(144,202,249,${p.a * 0.55})`;
          bgCtx.lineWidth = 0.8;
          bgCtx.stroke();
        } else if (cfg.fire) {
          const fs = p.r * (1 + Math.sin(tick * 0.1 + p.x) * 0.3);
          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, fs, 0, Math.PI * 2);
          const fc = p.a * (1 - p.y / bgCanvas.height);
          bgCtx.fillStyle = `rgba(255,${Math.floor(80 + p.y / bgCanvas.height * 120)},0,${fc * 0.65})`;
          bgCtx.fill();
        } else {
          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          bgCtx.fillStyle = cfg.pColor + Math.floor(p.a * 255).toString(16).padStart(2, '0');
          bgCtx.fill();
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > bgCanvas.height + 20) { p.y = -20; p.x = Math.random() * bgCanvas.width; }
        if (p.y < -20) p.y = bgCanvas.height + 20;
        if (p.x < 0 || p.x > bgCanvas.width) p.vx *= -1;
      });
    }
  }

  // ── witchy ──
  function initWitchy() {
    witchyParts = Array.from({ length: 130 }, () => ({
      x: Math.random() * wCanvas.width,
      y: Math.random() * wCanvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.007,
      hue: Math.random() < 0.5 ? 280 : 185,
    }));
  }

  let wTick = 0;
  function animateWitchy() {
    wFrame = requestAnimationFrame(animateWitchy);
    wTick++;
    wCtx.clearRect(0, 0, wCanvas.width, wCanvas.height);

    const grad = wCtx.createRadialGradient(
      wCanvas.width / 2, wCanvas.height / 2, 0,
      wCanvas.width / 2, wCanvas.height / 2, wCanvas.width * 0.8
    );
    grad.addColorStop(0, '#1a0030');
    grad.addColorStop(0.5, '#0d001a');
    grad.addColorStop(1, '#050010');
    wCtx.fillStyle = grad;
    wCtx.fillRect(0, 0, wCanvas.width, wCanvas.height);

    // pentagram
    const cx = wCanvas.width * 0.75, cy = wCanvas.height * 0.3, pr = 88;
    wCtx.save();
    wCtx.globalAlpha = 0.07 + 0.025 * Math.sin(wTick * 0.02);
    wCtx.strokeStyle = '#cc88ff'; wCtx.lineWidth = 1;
    wCtx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = k * 4 * Math.PI / 5 - Math.PI / 2;
      k === 0 ? wCtx.moveTo(cx + pr * Math.cos(a), cy + pr * Math.sin(a))
              : wCtx.lineTo(cx + pr * Math.cos(a), cy + pr * Math.sin(a));
    }
    wCtx.closePath(); wCtx.stroke(); wCtx.restore();

    // crescent moon
    wCtx.save(); wCtx.globalAlpha = 0.6;
    wCtx.shadowColor = '#cc99ff'; wCtx.shadowBlur = 22;
    wCtx.fillStyle = '#ecdcff';
    wCtx.beginPath(); wCtx.arc(80, 100, 42, 0, Math.PI * 2); wCtx.fill();
    wCtx.globalCompositeOperation = 'destination-out';
    wCtx.beginPath(); wCtx.arc(106, 86, 38, 0, Math.PI * 2); wCtx.fill();
    wCtx.globalCompositeOperation = 'source-over'; wCtx.restore();

    // floating orbs
    witchyParts.forEach(p => {
      p.a = Math.max(0.05, Math.min(0.9, p.a + p.da));
      if (p.a <= 0.05 || p.a >= 0.9) p.da *= -1;
      p.x += p.vx; p.y += p.vy + Math.sin(wTick * 0.01 + p.x) * 0.08;
      if (p.x < 0 || p.x > wCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > wCanvas.height) p.vy *= -1;
      wCtx.beginPath(); wCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      wCtx.fillStyle = `hsla(${p.hue},80%,70%,${p.a})`; wCtx.fill();
    });

    // runes
    const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ'];
    wCtx.font = '18px serif'; wCtx.textAlign = 'center';
    runes.forEach((r, i) => {
      const rx = wCanvas.width * (0.1 + i * 0.115);
      const ry = wCanvas.height * 0.9 + 8 * Math.sin(wTick * 0.02 + i);
      wCtx.fillStyle = `rgba(200,150,255,${0.18 + 0.1 * Math.sin(wTick * 0.03 + i)})`;
      wCtx.fillText(r, rx, ry);
    });
  }

  // ── public ──
  function apply(id) {
    cancelAnimationFrame(bgFrame);
    cancelAnimationFrame(wFrame);

    bgCanvas.style.display = 'none';
    wCanvas.style.display  = 'none';

    const cfg = CONFIGS[id];
    if (!cfg) return;

    if (cfg.type === 'witchy') {
      document.body.style.background = '#050010';
      wCanvas.style.display = 'block';
      initWitchy();
      animateWitchy();
    } else {
      document.body.style.background = cfg.palette[0];
      bgCanvas.style.display = 'block';
      if (cfg.stars)     initStars();
      if (cfg.particles) initParticles(cfg);
      animateBG(cfg);
    }

    State.set('bg', id);
  }

  function buildGrid() {
    const defs = [
      { id: 'forest', emoji: '🌲', label: 'Forest'   },
      { id: 'ocean',  emoji: '🌊', label: 'Ocean'    },
      { id: 'rain',   emoji: '🌧', label: 'Rain'     },
      { id: 'fire',   emoji: '🔥', label: 'Fireplace'},
      { id: 'space',  emoji: '🌌', label: 'Space'    },
      { id: 'witchy', emoji: '🔮', label: 'Witchy'   },
    ];
    const grid = document.getElementById('bg-grid');
    grid.innerHTML = '';
    const cur = State.get().bg;
    defs.forEach(d => {
      const el = document.createElement('div');
      el.className = 'bg-opt' + (d.id === cur ? ' active' : '');
      el.id = 'bgopt-' + d.id;
      el.innerHTML = `<span class="bg-opt-emoji">${d.emoji}</span>${d.label}`;
      el.addEventListener('click', () => {
        document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        apply(d.id);
      });
      grid.appendChild(el);
    });
  }

  return { apply, buildGrid };
})();
