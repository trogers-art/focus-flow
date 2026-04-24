// js/modules-manager.js

const MODULE_DEFS = [
  { id: 'planner',   title: 'Daily Planner', icon: '▦', minW: 320, defaultPos: { x: 16,  y: 16  } },
  { id: 'timer',     title: 'Focus Timer',   icon: '◷', minW: 240, defaultPos: { x: 356, y: 16  } },
  { id: 'quote',     title: 'Inspiration',   icon: '✦', minW: 270, defaultPos: { x: 614, y: 16  } },
  { id: 'mood',      title: 'Mood Check',    icon: '◉', minW: 230, defaultPos: { x: 16,  y: 430 } },
  { id: 'audio',     title: 'Ambience',      icon: '♪', minW: 260, defaultPos: { x: 264, y: 430 } },
  { id: 'braindump', title: 'Brain Dump',    icon: '◈', minW: 260, defaultPos: { x: 542, y: 430 } },
  { id: 'focusword', title: 'Focus Word',    icon: '◆', minW: 200, defaultPos: { x: 902, y: 16  } },
];

const ModuleManager = (() => {
  const stage = document.getElementById('stage');

  function createModule(def) {
    const s = State.get();
    const pos = s.modulePositions[def.id] || def.defaultPos;

    const el = document.createElement('div');
    el.className = 'module';
    el.id = 'mod-' + def.id;
    el.dataset.mid = def.id;
    el.style.minWidth = def.minW + 'px';
    el.style.left = pos.x + 'px';
    el.style.top  = pos.y + 'px';
    el.style.display = s.moduleVisible[def.id] ? 'block' : 'none';

    const header = document.createElement('div');
    header.className = 'module-header';
    header.innerHTML = `
      <span class="module-icon">${def.icon}</span>
      <span class="module-title">${def.title}</span>
      <button class="module-close" data-mid="${def.id}">✕</button>
    `;

    const body = document.createElement('div');
    body.className = 'module-body';
    body.id = 'mbody-' + def.id;

    el.appendChild(header);
    el.appendChild(body);
    stage.appendChild(el);

    header.querySelector('.module-close').addEventListener('click', () => {
      setVisible(def.id, false);
    });

    Drag.make(el, header);
    fillBody(def.id, body);

    return el;
  }

  function fillBody(id, body) {
    switch (id) {
      case 'planner':   Planner.build(body);     break;
      case 'timer':     Timer.build(body);        break;
      case 'quote':     Quote.build(body);        break;
      case 'mood':      Mood.build(body);         break;
      case 'audio':     AudioModule.build(body);  break;
      case 'braindump': BrainDump.build(body);    break;
      case 'focusword': FocusWord.build(body);    break;
    }
  }

  function setVisible(id, visible) {
    const el = document.getElementById('mod-' + id);
    if (el) el.style.display = visible ? 'block' : 'none';
    State.set('moduleVisible.' + id, visible);
    const btn = document.getElementById('mpi-' + id);
    if (btn) btn.classList.toggle('on', visible);
    if (visible) Drag.separateAll();
  }

  function buildList() {
    const list = document.getElementById('module-list');
    list.innerHTML = '';
    const s = State.get();
    MODULE_DEFS.forEach(def => {
      const div = document.createElement('div');
      div.className = 'mpi' + (s.moduleVisible[def.id] ? ' on' : '');
      div.id = 'mpi-' + def.id;
      div.innerHTML = `<span class="mpi-icon">${def.icon}</span>${def.title}`;
      div.addEventListener('click', () => {
        const cur = State.get().moduleVisible[def.id];
        setVisible(def.id, !cur);
      });
      list.appendChild(div);
    });
  }

  function init() {
    // If this is a fresh load with no saved positions, assign
    // default positions that are guaranteed not to overlap.
    const s = State.get();
    const hasAnySaved = Object.keys(s.modulePositions).length > 0;

    MODULE_DEFS.forEach(def => {
      if (!hasAnySaved) {
        // Force default positions — ignore anything stale in state
        State.set('modulePositions.' + def.id, def.defaultPos);
      }
      createModule(def);
    });

    buildList();

    // After render, run separator to catch any edge cases
    Drag.separateAll();
  }

  return { init, setVisible, buildList };
})();
