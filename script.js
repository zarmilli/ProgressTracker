/* ---------- STATE ---------- */
const STORAGE_KEY = "progress-tracker-data";

const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  programs: []
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let activeProgram = null;
let activeSession = null;

/* ---------- SESSION DRAWER ---------- */
const sessionDrawer = document.getElementById("sessionDrawer");

function openSessionDrawer(program, session) {
  closeDrawer();
  closeDeleteDrawer();

  activeProgram = program;
  activeSession = session;

  const titleEl = document.getElementById("sessionProgramTitle");
  if (titleEl) titleEl.textContent = program.name;

  sessionDrawer.classList.add("open");
}

function closeSessionDrawer() {
  sessionDrawer.classList.remove("open");
  activeProgram = null;
  activeSession = null;
}

/* ---------- SESSIONS ---------- */
function getActiveSession(program) {
  const today = new Date().toISOString().slice(0, 10);
  return program.sessions.find(
    s => s.date === today && !s.completedAt
  );
}

function getLatestSession(program) {
  const today = new Date().toISOString().slice(0, 10);
  return [...program.sessions]
    .reverse()
    .find(s => s.date === today);
}


function createSession(program) {
  const session = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    startedAt: new Date().toISOString(),
    completedAt: null,
    correct: 0,
    answered: 0,
    total: program.totalQuestions
  };

  program.sessions.push(session);
  return session;
}

/* ---------- GREETING ---------- */
function setGreeting() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
    hour < 16 ? "Good Day" :
    hour < 19 ? "Good Afternoon" :
    "Good Evening";

  document.getElementById("greeting").textContent =
    `${greeting}, Nonhle`;
}

/* ---------- CALENDAR ---------- */
function renderWeekCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    calendar.innerHTML += `
      <div class="day-pill ${date.toDateString() === today.toDateString() ? "active" : ""}">
        <span>${days[i]}</span>
        <div class="date-circle">${date.getDate()}</div>
      </div>
    `;
  }
}

/* ---------- ADD PROGRAM DRAWER ---------- */
const drawer = document.getElementById("programDrawer");
const backdrop = document.getElementById("drawerBackdrop");

function openDrawer() {
  closeSessionDrawer();
  closeDeleteDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("show");
}

function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
}

document.getElementById("addProgramBtn").onclick = openDrawer;
document.getElementById("cancelDrawer").onclick = closeDrawer;
backdrop.onclick = closeDrawer;

/* ---------- COLORS ---------- */
const COLORS = [
  "#6366f1", "#22c55e", "#f97316",
  "#ec4899", "#14b8a6", "#eab308"
];

const assignColor = () =>
  COLORS[Math.floor(Math.random() * COLORS.length)];

/* ---------- ADD PROGRAM ---------- */
document.getElementById("programForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = programName.value.trim();
  const totalQuestions = Number(programQuestions.value);
  if (!name || totalQuestions < 1) return;

  state.programs.push({
    id: crypto.randomUUID(),
    name,
    totalQuestions,
    color: assignColor(),
    sessions: [],
    createdAt: new Date().toISOString()
  });

  saveState();
  closeDrawer();
  e.target.reset();
  renderPrograms();
});

/* ---------- PROGRAM RENDER ---------- */
function getButtonLabel(program) {
  const active = getActiveSession(program);
  const latest = getLatestSession(program);

  if (active) return "Continue";
  if (latest?.completedAt) return "Do again";
  return "Start";
}


function renderPrograms() {
  const list = document.getElementById("programList");
  list.innerHTML = "";

  state.programs.forEach(p => {
    const activeSession = getActiveSession(p);
const latestSession = getLatestSession(p);

const sourceSession = activeSession || latestSession;

const correct = sourceSession ? sourceSession.correct : 0;
const percent = sourceSession
  ? Math.round((correct / p.totalQuestions) * 100)
  : 0;

const statusClass = latestSession?.completedAt ? "done" : "not-done";
const statusText = statusClass === "done" ? "Done" : "Not done";


    list.innerHTML += `
      <article class="program-card"
        data-program-id="${p.id}"
        style="background:${p.color}">
        
        <header class="program-card__header">
          <h3 class="program-title">${p.name}</h3>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </header>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>

        <div class="program-stats">
          <span class="stat-label">Questions correct</span>
          <span class="stat-value">${correct} of ${p.totalQuestions}</span>
        </div>

        <footer class="program-card__footer">
          <button class="program-start-btn">${getButtonLabel(p)}</button>
          <span class="program-percentage">${percent}%</span>
        </footer>
      </article>
    `;
  });
}

/* ---------- PROGRAM START ---------- */
document.getElementById("programList").addEventListener("click", e => {
  if (!e.target.classList.contains("program-start-btn")) return;

  const card = e.target.closest(".program-card");
  if (!card) return;

  const program = state.programs.find(p => p.id === card.dataset.programId);
  if (!program) return;

  let session = getActiveSession(program);
  if (!session) {
    session = createSession(program);
    saveState();
  }

  openSessionDrawer(program, session);
});


/* ---------- ANSWERS (EVENT DELEGATION) ---------- */
sessionDrawer.addEventListener("click", e => {
  const btn = e.target.closest(".answer-btn");
  if (!btn || !activeSession) return;

  if (btn.classList.contains("correct")) {
    answer(true);
  }

  if (btn.classList.contains("wrong")) {
    answer(false);
  }
});

function answer(isCorrect) {
  if (!activeSession) return;

  // Prevent answering beyond total
  if (activeSession.answered >= activeSession.total) return;

  activeSession.answered++;

  if (isCorrect) {
    activeSession.correct++;
  }

  // Auto-complete when limit reached
  if (activeSession.answered >= activeSession.total) {
    completeSession();
    return;
  }

  saveState();
}


/* ---------- SESSION ACTIONS ---------- */
document.getElementById("saveSessionBtn").onclick = () => {
  saveState();
  closeSessionDrawer();
  renderPrograms();
};

document.getElementById("cancelSessionBtn").onclick = () => {
  activeProgram.sessions =
    activeProgram.sessions.filter(s => s !== activeSession);

  saveState();
  closeSessionDrawer();
  renderPrograms();
};

function completeSession() {
  if (!activeSession || !activeProgram) return;

  activeSession.completedAt = new Date().toISOString();

  saveState();
  closeSessionDrawer();
  renderPrograms();
}


/* ---------- DELETE PROGRAM DRAWER ---------- */
const deleteDrawer = document.getElementById("deleteDrawer");
const deleteBackdrop = document.getElementById("deleteBackdrop");
const deleteList = document.getElementById("deleteProgramList");
const selectedForDeletion = new Set();

function openDeleteDrawer() {
  closeDrawer();
  closeSessionDrawer();

  selectedForDeletion.clear();
  renderDeleteList();

  deleteDrawer.classList.add("open");
  deleteBackdrop.classList.add("show");
}

function closeDeleteDrawer() {
  deleteDrawer.classList.remove("open");
  deleteBackdrop.classList.remove("show");
}

function renderDeleteList() {
  deleteList.innerHTML = "";

  state.programs.forEach(p => {
    const item = document.createElement("div");
    item.className = "delete-item";
    item.textContent = p.name;

    item.onclick = () => {
      item.classList.toggle("selected");
      selectedForDeletion.has(p.id)
        ? selectedForDeletion.delete(p.id)
        : selectedForDeletion.add(p.id);
    };

    deleteList.appendChild(item);
  });
}

function confirmDeletePrograms() {
  if (!selectedForDeletion.size) {
    closeDeleteDrawer();
    return;
  }

  state.programs = state.programs.filter(
    p => !selectedForDeletion.has(p.id)
  );

  saveState();
  renderPrograms();
  closeDeleteDrawer();
}

/* --- DELETE BUTTON WIRING (DELEGATED) --- */
document.addEventListener("click", e => {
  if (e.target.id === "deleteProgramBtn") openDeleteDrawer();
  if (e.target.id === "cancelDeleteBtn") closeDeleteDrawer();
  if (e.target.id === "confirmDeleteBtn") confirmDeletePrograms();
});

deleteBackdrop.onclick = closeDeleteDrawer;



/* ---------- INIT ---------- */
setGreeting();
renderWeekCalendar();
renderPrograms();
