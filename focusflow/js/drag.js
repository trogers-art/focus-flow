// js/drag.js
// Collision-preventing drag. The dragged module cannot overlap any other.
// Uses real getBoundingClientRect() for pixel-perfect detection.

const Drag = (() => {
  const TOPBAR_H = 52;
  const GAP = 6; // minimum pixels between modules

  let active = null; // { el, ox, oy }

  // ── rect helpers ─────────────────────────────────────────────

  function rect(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  function overlaps(a, b) {
    return (
      a.x          < b.x + b.w + GAP &&
      a.x + a.w + GAP > b.x &&
      a.y          < b.y + b.h + GAP &&
      a.y + a.h + GAP > b.y
    );
  }

  // ── constraint solver ────────────────────────────────────────
  // Given where the user WANTS the module to be, return the
  // nearest position that doesn't overlap any other module.

  function constrain(el, wantX, wantY) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;

    // Viewport clamp first
    let x = Math.max(0, Math.min(wantX, W - mw));
    let y = Math.max(TOPBAR_H, Math.min(wantY, H - mh));

    // Collect all other visible modules
    const others = Array.from(document.querySelectorAll('.module'))
      .filter(m => m !== el && m.style.display !== 'none');

    if (others.length === 0) return { x, y };

    // Iterative push-out: up to 30 rounds should always converge
    for (let round = 0; round < 30; round++) {
      const c = { x, y, w: mw, h: mh };
      let moved = false;

      for (const other of others) {
        const o = rect(other);
        if (!overlaps(c, o)) continue;

        // How much do we penetrate in each axis/direction?
        const pushRight = (o.x + o.w + GAP) - c.x;   // push us right
        const pushLeft  = (c.x + c.w + GAP) - o.x;   // push us left
        const pushDown  = (o.y + o.h + GAP) - c.y;   // push us down
        const pushUp    = (c.y + c.h + GAP) - o.y;   // push us up

        // Pick the smallest escape — least visual disruption
        const least = Math.min(pushRight, pushLeft, pushDown, pushUp);

        if      (least === pushRight) c.x += pushRight;
        else if (least === pushLeft)  c.x -= pushLeft;
        else if (least === pushDown)  c.y += pushDown;
        else                          c.y -= pushUp;

        // Re-clamp after each push
        c.x = Math.max(0, Math.min(c.x, W - mw));
        c.y = Math.max(TOPBAR_H, Math.min(c.y, H - mh));
        moved = true;
      }

      x = c.x;
      y = c.y;
      if (!moved) break; // settled — no overlaps remain
    }

    return { x, y };
  }

  // ── place a module at (x, y) and persist ─────────────────────

  function place(el, x, y) {
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.right = 'auto';
    State.set('modulePositions.' + el.dataset.mid, { x, y });
  }

  // ── event handlers ───────────────────────────────────────────

  function onMouseMove(e) {
    if (!active) return;
    const wantX = e.clientX - active.ox;
    const wantY = e.clientY - active.oy;
    const { x, y } = constrain(active.el, wantX, wantY);
    place(active.el, x, y);
  }

  function onMouseUp() {
    if (!active) return;
    active.el.classList.remove('is-dragging');
    State.save();
    active = null;
  }

  // Attach global listeners once
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // ── public API ───────────────────────────────────────────────

  function make(moduleEl, headerEl) {
    headerEl.addEventListener('mousedown', e => {
      // Don't steal clicks from interactive children
      if (
        e.target.closest('button') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA'
      ) return;

      const r = moduleEl.getBoundingClientRect();
      active = {
        el: moduleEl,
        ox: e.clientX - r.left,
        oy: e.clientY - r.top,
      };

      moduleEl.classList.add('is-dragging');
      moduleEl.style.zIndex = ++Drag.zTop;
      e.preventDefault();
    });
  }

  // Separate all visible modules from each other (run after load / show)
  function separateAll() {
    // Wait two frames so layout is complete and rects are real
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const mods = Array.from(document.querySelectorAll('.module'))
        .filter(m => m.style.display !== 'none');

      const W = window.innerWidth;
      const H = window.innerHeight;

      // Sort top-left → bottom-right: top-left modules stay put
      mods.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return (ra.left + ra.top) - (rb.left + rb.top);
      });

      let changed = true;
      for (let round = 0; round < 40 && changed; round++) {
        changed = false;
        for (let i = 1; i < mods.length; i++) {
          const el = mods[i];
          const mw = el.offsetWidth;
          const mh = el.offsetHeight;
          const c = {
            x: parseFloat(el.style.left) || 0,
            y: parseFloat(el.style.top)  || 0,
            w: mw,
            h: mh,
          };

          for (let j = 0; j < i; j++) {
            const other = mods[j];
            const o = {
              x: parseFloat(other.style.left) || 0,
              y: parseFloat(other.style.top)  || 0,
              w: other.offsetWidth,
              h: other.offsetHeight,
            };

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
            changed = true;
          }

          el.style.left  = c.x + 'px';
          el.style.top   = c.y + 'px';
          el.style.right = 'auto';
          State.set('modulePositions.' + el.dataset.mid, { x: c.x, y: c.y });
        }
      }

      State.save();
    }));
  }

  return { make, separateAll, zTop: 50 };
})();
