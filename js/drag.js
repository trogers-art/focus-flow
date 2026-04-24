// js/drag.js
// Collision-preventing drag system.
// During drag: module cannot overlap any other (real-time constraint).
// On load: separateAll() spreads modules apart based on actual rendered sizes.

const Drag = (() => {
  const TOPBAR_H = 52;
  const GAP = 10;

  let active = null;

  function overlaps(a, b) {
    return (
      a.x          < b.x + b.w + GAP &&
      a.x + a.w + GAP > b.x &&
      a.y          < b.y + b.h + GAP &&
      a.y + a.h + GAP > b.y
    );
  }

  function constrain(el, wantX, wantY) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;

    let x = Math.max(0, Math.min(wantX, W - mw));
    let y = Math.max(TOPBAR_H, Math.min(wantY, H - mh));

    const others = Array.from(document.querySelectorAll('.module'))
      .filter(m => m !== el && m.style.display !== 'none');

    if (others.length === 0) return { x, y };

    for (let round = 0; round < 30; round++) {
      const c = { x, y, w: mw, h: mh };
      let moved = false;

      for (const other of others) {
        const r = other.getBoundingClientRect();
        const o = { x: r.left, y: r.top, w: r.width, h: r.height };
        if (!overlaps(c, o)) continue;

        const pushRight = (o.x + o.w + GAP) - c.x;
        const pushLeft  = (c.x + c.w + GAP) - o.x;
        const pushDown  = (o.y + o.h + GAP) - c.y;
        const pushUp    = (c.y + c.h + GAP) - o.y;
        const least = Math.min(pushRight, pushLeft, pushDown, pushUp);

        if      (least === pushRight) c.x += pushRight;
        else if (least === pushLeft)  c.x -= pushLeft;
        else if (least === pushDown)  c.y += pushDown;
        else                          c.y -= pushUp;

        c.x = Math.max(0, Math.min(c.x, W - mw));
        c.y = Math.max(TOPBAR_H, Math.min(c.y, H - mh));
        moved = true;
      }

      x = c.x; y = c.y;
      if (!moved) break;
    }

    return { x, y };
  }

  function place(el, x, y) {
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    el.style.right = 'auto';
    State.set('modulePositions.' + el.dataset.mid, { x, y });
  }

  document.addEventListener('mousemove', e => {
    if (!active) return;
    const { x, y } = constrain(active.el, e.clientX - active.ox, e.clientY - active.oy);
    place(active.el, x, y);
  });

  document.addEventListener('mouseup', () => {
    if (!active) return;
    active.el.classList.remove('is-dragging');
    State.save();
    active = null;
  });

  function make(moduleEl, headerEl) {
    headerEl.addEventListener('mousedown', e => {
      if (
        e.target.closest('button') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA'
      ) return;

      const r = moduleEl.getBoundingClientRect();
      active = { el: moduleEl, ox: e.clientX - r.left, oy: e.clientY - r.top };
      moduleEl.classList.add('is-dragging');
      moduleEl.style.zIndex = ++Drag.zTop;
      e.preventDefault();
    });
  }

  // separateAll: uses getBoundingClientRect so sizes are always real.
  // Waits 3 frames to ensure the browser has fully rendered everything.
  function separateAll() {
    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      const W = window.innerWidth;
      const H = window.innerHeight;

      const mods = Array.from(document.querySelectorAll('.module'))
        .filter(m => m.style.display !== 'none');

      if (mods.length === 0) return;

      // Build working set from real rendered rects
      const rects = mods.map(m => {
        const r = m.getBoundingClientRect();
        return { el: m, x: r.left, y: r.top, w: r.width, h: r.height };
      });

      // Sort top-left first — those keep their spots
      rects.sort((a, b) => (a.x + a.y) - (b.x + b.y));

      let changed = true;
      for (let round = 0; round < 50 && changed; round++) {
        changed = false;
        for (let i = 1; i < rects.length; i++) {
          const c = rects[i];
          for (let j = 0; j < i; j++) {
            const o = rects[j];
            if (!overlaps(c, o)) continue;

            const pushRight = (o.x + o.w + GAP) - c.x;
            const pushLeft  = (c.x + c.w + GAP) - o.x;
            const pushDown  = (o.y + o.h + GAP) - c.y;
            const pushUp    = (c.y + c.h + GAP) - o.y;
            const least = Math.min(pushRight, pushLeft, pushDown, pushUp);

            if      (least === pushRight) c.x += pushRight;
            else if (least === pushLeft)  c.x -= pushLeft;
            else if (least === pushDown)  c.y += pushDown;
            else                          c.y -= pushUp;

            c.x = Math.max(0, Math.min(c.x, W - c.w));
            c.y = Math.max(TOPBAR_H, Math.min(c.y, H - c.h));
            changed = true;
          }
        }
      }

      // Apply final positions
      rects.forEach(r => {
        place(r.el, r.x, r.y);
      });

      State.save();
    })));

    run();
  }

  return { make, separateAll, zTop: 50 };
})();
