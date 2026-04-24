// js/clock.js
const Clock = (() => {
  const clockEl = document.getElementById('clock-display');
  const dateEl  = document.getElementById('date-display');

  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateEl.textContent  = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  tick();
  setInterval(tick, 1000);
})();
