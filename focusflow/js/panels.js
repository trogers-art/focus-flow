// js/panels.js
const Panels = (() => {
  function setup() {
    const btnModules = document.getElementById('btn-modules');
    const btnScene   = document.getElementById('btn-scene');
    const btnMantra  = document.getElementById('btn-mantra');
    const modPanel   = document.getElementById('modules-panel');
    const scenePanel = document.getElementById('scene-panel');
    const overlay    = document.getElementById('mantra-overlay');

    function toggle(panel) {
      const isOpen = panel.classList.contains('open');
      [modPanel, scenePanel].forEach(p => p.classList.remove('open'));
      if (!isOpen) panel.classList.add('open');
    }

    btnModules.addEventListener('click', (e) => { e.stopPropagation(); toggle(modPanel); });
    btnScene.addEventListener('click', (e)   => { e.stopPropagation(); toggle(scenePanel); });

    btnMantra.addEventListener('click', () => {
      const s = State.get();
      const q = s.quotes[s.quoteIdx % s.quotes.length];
      document.getElementById('mantra-text').textContent   = '\u201c' + q.text + '\u201d';
      document.getElementById('mantra-author').textContent = q.author ? '\u2014 ' + q.author : '';
      overlay.classList.add('open');
    });

    overlay.addEventListener('click', () => overlay.classList.remove('open'));

    // Close panels on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#modules-panel') && !e.target.closest('#btn-modules'))
        modPanel.classList.remove('open');
      if (!e.target.closest('#scene-panel') && !e.target.closest('#btn-scene'))
        scenePanel.classList.remove('open');
    });
  }

  return { setup };
})();
