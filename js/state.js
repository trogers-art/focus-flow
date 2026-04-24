// js/state.js — single source of truth, persisted to localStorage

const STATE_KEY = 'focusflow_v3';

const defaults = {
  bg: 'forest',
  activeDay: new Date().toISOString().slice(0, 10),
  tasks: {},
  quotes: [
    { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    { text: "You are enough, exactly as you are.", author: "" },
    { text: "Your energy is sacred. Protect it.", author: "" },
    { text: "One thing at a time. Right now. Just this.", author: "" },
  ],
  quoteIdx: 0,
  focusWord: 'PRESENT',
  selectedMood: '',
  moodHistory: [],
  // module visibility
  moduleVisible: {
    planner: true, timer: true, quote: true,
    mood: true, audio: true, braindump: true, focusword: true,
  },
  // module positions: { id: {x, y} }
  modulePositions: {},
};

const State = (() => {
  let data = {};

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
      data = deepMerge(structuredClone(defaults), saved);
    } catch (e) {
      data = structuredClone(defaults);
    }
  }

  function save() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function get() { return data; }

  function set(path, value) {
    // path like 'modulePositions.planner' or 'bg'
    const parts = path.split('.');
    let obj = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] === undefined) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    save();
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  load();
  return { get, set, save };
})();
