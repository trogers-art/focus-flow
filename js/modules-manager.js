// js/modules-manager.js

const MODULE_DEFS = [
  { id: 'planner',   title: 'Daily Planner', icon: '📋', minW: 320, defaultPos: { x: 20,  y: 20  } },
  { id: 'timer',     title: 'Focus Timer',   icon: '⏱',  minW: 240, defaultPos: { x: 360, y: 20  } },
  { id: 'quote',     title: 'Inspiration',   icon: '✦',  minW: 270, defaultPos: { x: 620, y: 20  } },
  { id: 'mood',      title: 'Mood Check',    icon: '🌿', minW: 230, defaultPos: { x: 20,  y: 380 } },
  { id: 'audio',     title: 'Ambience',      icon: '♪',  minW: 260, defaultPos: { x: 270, y: 380 } },
  { id: 'braindump', title: 'Brain Dump',    icon: '🧠', minW: 260, defaultPos: { x: 550, y: 380 } },
  { id: 'focusword', title: 'Focus Word',    icon: '◈',  minW: 200, defaultPos: { x: 830, y: 20  } },
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

    // Close button
    header.querySelector('.module-close').addEventListener('click', () => {
      setVisible(def.id, false);
    });

    // Register with drag system
    Drag.make(el, header);

    // Fill content
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
    // Update panel button
    const btn = document.getElementById('mpi-' + id);
    if (btn) btn.classList.toggle('on', visible);
    // Re-separate after showing a new module
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
    MODULE_DEFS.forEach(createModule);
    buildList();
    Drag.separateAll();
  }

  return { init, setVisible, buildList };
})();
