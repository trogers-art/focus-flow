// js/modules/planner.js
const Planner = (() => {
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  function getTasks(day) {
    const s = State.get();
    if (!s.tasks[day]) { s.tasks[day] = []; State.save(); }
    return s.tasks[day];
  }

  function build(body) {
    body.style.padding = '0';
    body.innerHTML = '';

    // Date strip
    const strip = document.createElement('div');
    strip.className = 'planner-dates';
    for (let i = -1; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const btn = document.createElement('div');
      btn.className = 'pdate' + (iso === State.get().activeDay ? ' active' : '');
      btn.dataset.iso = iso;
      btn.innerHTML = `<span class="pday">${DAYS[d.getDay()]}</span><span class="pnum">${d.getDate()}</span>`;
      btn.addEventListener('click', () => {
        State.set('activeDay', iso);
        strip.querySelectorAll('.pdate').forEach(b => b.classList.toggle('active', b.dataset.iso === iso));
        renderTasks(taskList);
      });
      strip.appendChild(btn);
    }
    body.appendChild(strip);

    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    body.appendChild(taskList);

    const addRow = document.createElement('div');
    addRow.className = 'task-add';
    addRow.innerHTML = `
      <input id="task-inp" type="text" placeholder="Add task…">
      <input id="task-time" type="time" style="width:78px">
      <select id="task-pri">
        <option value="low">Low</option>
        <option value="med" selected>Med</option>
        <option value="high">High</option>
      </select>
      <button class="add-btn" id="task-add-btn">Add</button>
    `;
    body.appendChild(addRow);

    const inp = addRow.querySelector('#task-inp');
    const addBtn = addRow.querySelector('#task-add-btn');

    function addTask() {
      const text = inp.value.trim();
      if (!text) return;
      const time = addRow.querySelector('#task-time').value;
      const pri  = addRow.querySelector('#task-pri').value;
      const day  = State.get().activeDay;
      getTasks(day).push({ id: Date.now(), text, time, pri, done: false });
      State.save();
      inp.value = '';
      renderTasks(taskList);
    }

    addBtn.addEventListener('click', addTask);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

    renderTasks(taskList);
  }

  function renderTasks(container) {
    const day   = State.get().activeDay;
    const tasks = getTasks(day);
    container.innerHTML = '';

    if (!tasks.length) {
      container.innerHTML = '<div class="task-empty">No tasks yet. Add one below ↓</div>';
      return;
    }

    tasks.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'task-row' + (t.done ? ' done' : '');

      const priEl = document.createElement('div');
      priEl.className = `task-pri pri-${t.pri || 'med'}`;

      const check = document.createElement('div');
      check.className = 'task-check';
      check.addEventListener('click', () => {
        t.done = !t.done;
        State.save();
        row.classList.toggle('done', t.done);
      });

      const label = document.createElement('span');
      label.className = 'task-label';
      label.textContent = t.text;

      const timeEl = document.createElement('span');
      timeEl.className = 'task-time';
      timeEl.textContent = t.time || '';

      const del = document.createElement('button');
      del.className = 'task-del';
      del.textContent = '✕';
      del.addEventListener('click', () => {
        getTasks(day).splice(i, 1);
        State.save();
        renderTasks(container);
      });

      row.append(priEl, check, label, timeEl, del);
      container.appendChild(row);
    });
  }

  return { build };
})();
