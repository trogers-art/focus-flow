// js/app.js — boots everything in the right order

document.addEventListener('DOMContentLoaded', () => {
  // 1. Clock
  Clock;

  // 2. Background
  Background.buildGrid();
  Background.apply(State.get().bg);

  // 3. Panels
  Panels.setup();

  // 4. Modules (creates DOM, registers drag, fills content, then separates)
  ModuleManager.init();
});
