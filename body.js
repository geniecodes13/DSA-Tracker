// ====== Simple DSA Tracker (localStorage-based) ======
(function () {
  const STORAGE_KEY = "dsa-tracker-tasks-v1";

  /**
   * @typedef {"today" | "week" | "later"} Period
   *
   * @typedef Task
   * @property {string} id
   * @property {string} title
   * @property {string} topic
   * @property {string} difficulty
   * @property {Period} period
   * @property {string} notes
   * @property {boolean} completed
   * @property {number} createdAt
   */

  /** @type {Task[]} */
  let tasks = [];

  // Elements
  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("title");
  const topicInput = document.getElementById("topic");
  const difficultySelect = document.getElementById("difficulty");
  const periodSelect = document.getElementById("period");
  const notesInput = document.getElementById("notes");

  const listToday = document.getElementById("list-today");
  const listWeek = document.getElementById("list-week");
  const listLater = document.getElementById("list-later");
  const completedList = document.getElementById("completedList");

  const todayCountEl = document.querySelector('[data-count="today"]');
  const weekCountEl = document.querySelector('[data-count="week"]');
  const laterCountEl = document.querySelector('[data-count="later"]');

  const todayDisplay = document.getElementById("todayDisplay");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");

  // Guard against running before DOM is ready
  if (
    !form ||
    !titleInput ||
    !difficultySelect ||
    !periodSelect ||
    !listToday ||
    !listWeek ||
    !listLater ||
    !completedList
  ) {
    // If the script is loaded in <head>, wait for DOMContentLoaded
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ===== Helpers =====
  function formatDate(d) {
    const opts = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString(undefined, opts);
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Ignore quota / privacy mode errors
    }
  }

  function generateId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 7)
    );
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function createEmptyState(message) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.textContent = message;
    return div;
  }

  function createTaskElement(task) {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    if (task.completed) {
      taskEl.classList.add("completed");
    }

    // Left: checkbox
    const left = document.createElement("div");
    left.className = "task-left";

    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "checkbox-wrapper";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      toggleTaskCompleted(task.id, checkbox.checked);
    });

    checkboxWrapper.appendChild(checkbox);
    left.appendChild(checkboxWrapper);

    // Main content
    const main = document.createElement("div");
    main.className = "task-main";

    const titleRow = document.createElement("div");
    titleRow.className = "task-title-row";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    titleRow.appendChild(title);

    main.appendChild(titleRow);

    // Meta pills
    const meta = document.createElement("div");
    meta.className = "task-meta";

    const diffPill = document.createElement("span");
    diffPill.className = "pill";
    if (task.difficulty === "Easy") {
      diffPill.classList.add("pill--easy");
    } else if (task.difficulty === "Medium") {
      diffPill.classList.add("pill--medium");
    } else if (task.difficulty === "Hard") {
      diffPill.classList.add("pill--hard");
    }
    diffPill.textContent = task.difficulty || "Unknown";
    meta.appendChild(diffPill);

    if (task.topic) {
      const topicPill = document.createElement("span");
      topicPill.className = "pill pill--topic";
      topicPill.textContent = task.topic;
      meta.appendChild(topicPill);
    }

    main.appendChild(meta);

    if (task.notes) {
      const notes = document.createElement("div");
      notes.className = "task-notes";
      notes.textContent = task.notes;
      main.appendChild(notes);
    }

    const footer = document.createElement("div");
    footer.className = "task-footer";

    const createdSmall = document.createElement("small");
    createdSmall.textContent = `Added on ${formatDate(
      new Date(task.createdAt)
    )}`;
    footer.appendChild(createdSmall);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-icon btn-icon--danger";
    deleteBtn.innerHTML = '<span>✕</span><span>Delete</span>';
    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    actions.appendChild(deleteBtn);
    footer.appendChild(actions);

    main.appendChild(footer);

    taskEl.appendChild(left);
    taskEl.appendChild(main);

    return taskEl;
  }

  function createCompletedPill(task) {
    const pill = document.createElement("div");
    pill.className = "completed-pill";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.title;
    pill.appendChild(titleSpan);

    if (task.topic) {
      const topicSpan = document.createElement("span");
      topicSpan.textContent = `• ${task.topic}`;
      pill.appendChild(topicSpan);
    }

    const checkSpan = document.createElement("span");
    checkSpan.textContent = "✓";
    pill.appendChild(checkSpan);

    return pill;
  }

  function render() {
    clearElement(listToday);
    clearElement(listWeek);
    clearElement(listLater);
    clearElement(completedList);

    const counts = { today: 0, week: 0, later: 0 };

    tasks.forEach((task) => {
      if (task.completed) {
        completedList.appendChild(createCompletedPill(task));
        return;
      }

      let container = listToday;
      if (task.period === "week") container = listWeek;
      if (task.period === "later") container = listLater;

      counts[task.period] += 1;
      container.appendChild(createTaskElement(task));
    });

    if (!counts.today) {
      listToday.appendChild(
        createEmptyState("No tasks for today yet. Add a problem above.")
      );
    }
    if (!counts.week) {
      listWeek.appendChild(
        createEmptyState("Plan a few problems for this week.")
      );
    }
    if (!counts.later) {
      listLater.appendChild(
        createEmptyState("Backlog of problems to tackle soon.")
      );
    }

    if (!tasks.some((t) => t.completed)) {
      const empty = document.createElement("span");
      empty.className = "completed-empty";
      empty.textContent =
        "Nothing solved yet. Start by checking some tasks above.";
      completedList.appendChild(empty);
    }

    if (todayCountEl) todayCountEl.textContent = String(counts.today);
    if (weekCountEl) weekCountEl.textContent = String(counts.week);
    if (laterCountEl) laterCountEl.textContent = String(counts.later);
  }

  // ===== Event handlers =====
  function handleSubmit(event) {
    event.preventDefault();
    const title = titleInput.value.trim();
    const topic = topicInput.value.trim();
    const difficulty = difficultySelect.value || "Medium";
    const period = periodSelect.value || "today";
    const notes = notesInput.value.trim();

    if (!title) {
      titleInput.focus();
      return;
    }

    const newTask = {
      id: generateId(),
      title,
      topic,
      difficulty,
      period,
      notes,
      completed: false,
      createdAt: Date.now(),
    };

    tasks.push(newTask);
    saveTasks();
    render();

    form.reset();
    difficultySelect.value = "Medium";
    periodSelect.value = "today";
  }

  function toggleTaskCompleted(id, completed) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = completed;
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }

  function handleClearAll() {
    if (!tasks.length) return;
    if (!confirm("Clear all tasks?")) return;
    tasks = [];
    saveTasks();
    render();
  }

  function handleClearCompleted() {
    if (!tasks.some((t) => t.completed)) return;
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    render();
  }

  function init() {
    if (todayDisplay) {
      todayDisplay.textContent = formatDate(new Date());
    }

    tasks = loadTasks();
    render();

    if (form) form.addEventListener("submit", handleSubmit);
    if (clearAllBtn) clearAllBtn.addEventListener("click", handleClearAll);
    if (clearCompletedBtn)
      clearCompletedBtn.addEventListener("click", handleClearCompleted);
  }
})();

/*
</style>
</head>
<body>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="title-group">
        <h1>
          <span class="title-accent-dot"></span>
          DSA Tracker
        </h1>
        <p>Organize your practice by time period and mark problems as completed.</p>
      </div>
      <div class="header-meta">
        <span id="todayDisplay"></span>
        <span>Progress saved in this browser.</span>
      </div>
    </header>

    <!-- Add Task Card -->
    <section class="card">
      <div class="card-header">
        <h2>New Problem</h2>
        <small>Quickly log a DSA problem to solve.</small>
      </div>
      <form id="taskForm">
        <div class="form-grid">
          <div class="form-group form-title">
            <label for="title">Problem Title *</label>
            <input
              type="text"
              id="title"
              placeholder="e.g. 2-Sum, Reverse Linked List"
              required
            />
          </div>

          <div class="form-group form-topic">
            <label for="topic">Topic</label>
            <input
              type="text"
              id="topic"
              placeholder="e.g. Arrays, DP, Graphs"
            />
          </div>

          <div class="form-group form-diff">
            <label for="difficulty">Difficulty</label>
            <select id="difficulty">
              <option value="Easy">Easy</option>
              <option value="Medium" selected>Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div class="form-group form-period">
            <label for="period">Time Period</label>
            <select id="period">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="later">Later</option>
            </select>
          </div>

          <div class="form-group form-notes">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              placeholder="Short notes, approach, or link (e.g. LeetCode / GFG URL)"
            ></textarea>
          </div>

          <div class="form-group form-submit">
            <button type="submit" class="btn-primary">
              <span class="icon">＋</span>
              <span>Add Problem</span>
            </button>
          </div>
        </div>
      </form>

      <div class="small-actions">
        <button type="button" class="btn-secondary" id="clearAllBtn">
          Clear all
        </button>
        <button type="button" class="btn-secondary" id="clearCompletedBtn">
          Clear completed
        </button>
      </div>
    </section>

    <!-- Task Columns -->
    <section>
      <div class="columns-header">
        <h2>Plan by Time Period</h2>
        <small>Drag-and-drop isn’t required; just choose the period when adding.</small>
      </div>

      <div class="columns">
        <div class="column column--today" data-period="today">
          <div class="column-title">
            <span>Today</span>
            <span class="column-count" data-count="today">0</span>
          </div>
          <div class="column-body" id="list-today">
            <div class="empty-state">No tasks for today yet. Add a problem above.</div>
          </div>
        </div>
        <div class="column column--week" data-period="week">
          <div class="column-title">
            <span>This Week</span>
            <span class="column-count" data-count="week">0</span>
          </div>
          <div class="column-body" id="list-week">
            <div class="empty-state">Plan a few problems for this week.</div>
          </div>
        </div>

        <div class="column column--later" data-period="later">
          <div class="column-title">
            <span>Later</span>
            <span class="column-count" data-count="later">0</span>
          </div>
          <div class="column-body" id="list-later">
            <div class="empty-state">Backlog of problems to tackle soon.</div>
          </div>
        </div>
      </div>
    </section>
    <!-- Completed Section -->
    <section class="completed-section">
      <div class="completed-header">
        <h2>Completed</h2>
        <small>Problems you’ve ticked off.</small>
      </div>
      <div id="completedList" class="completed-list">
        <span class="completed-empty">Nothing solved yet. Start by checking some tasks above.</span>
      </div>
    </section>
  </div>

  <script>
    // ====== Simple DSA Tracker (localStorage-based) ======
    (function () {
      const STORAGE_KEY = "dsa-tracker-tasks-v1";

      /** @type {Array<{id:string,title:string,topic:string,difficulty:string,period:'today'|'week'|'later',notes:string,completed:boolean,createdAt:number}>} */
      let tasks = [];

      // Elements
      const form = document.getElementById("taskForm");
      const titleInput = document.getElementById("title");
      const topicInput = document.getElementById("topic");
      const difficultySelect = document.getElementById("difficulty");
      const periodSelect = document.getElementById("period");
      const notesInput = document.getElementById("notes");
      const listToday = document.getElementById("list-today");
      const listWeek = document.getElementById("list-week");
      const listLater = document.getElementById("list-later");
      const completedList = document.getElementById("completedList");

      const todayCountEl = document.querySelector('[data-count="today"]');
      const weekCountEl = document.querySelector('[data-count="week"]');
      const laterCountEl = document.querySelector('[data-count="later"]');

      const todayDisplay = document.getElementById("todayDisplay");
      const clearAllBtn = document.getElementById("clearAllBtn");
      const clearCompletedBtn = document.getElementById("clearCompletedBtn");

      // ===== Helpers =====
      function formatDate(d) {
        const opts = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
        return d.toLocaleDateString(undefined, opts);
      }
      function loadTasks() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed;
        } catch {
          return [];
        }
      }

