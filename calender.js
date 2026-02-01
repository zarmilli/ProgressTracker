/* ---------- STATE ---------- */
const STORAGE_KEY = "progress-tracker-data";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { programs: [] };

let selectedDate = new Date().toISOString().slice(0,10);
let calendarExpanded = false;
let calendarMonth = new Date();

/* ---------- WEEK ---------- */
function renderWeek() {
  const week = document.getElementById("calendarWeek");
  week.innerHTML = "";

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const dateStr = d.toISOString().slice(0,10);

    const div = document.createElement("div");
    div.className = "week-day" + (dateStr === selectedDate ? " active" : "");
    div.innerHTML = `
      <span>${labels[i]}</span>
      <span class="date">${d.getDate()}</span>
    `;

    div.onclick = () => selectDate(dateStr);
    week.appendChild(div);
  }
}

/* ---------- MONTH ---------- */
function renderMonth() {
  const grid = document.getElementById("monthGrid");
  grid.innerHTML = "";

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  document.getElementById("monthLabel").textContent =
    calendarMonth.toLocaleDateString("en", { month: "long", year: "numeric" });

  const days = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= days; i++) {
    const dateStr = new Date(year, month, i).toISOString().slice(0,10);

    const hasData = state.programs.some(p =>
      p.sessions.some(s => s.date === dateStr)
    );

    const div = document.createElement("div");
    div.className = "month-day" +
      (hasData ? " has-data" : "") +
      (dateStr === selectedDate ? " selected" : "");

    div.textContent = i;
    div.onclick = () => selectDate(dateStr);

    grid.appendChild(div);
  }
}

/* ---------- DATE SELECT ---------- */
function selectDate(dateStr) {
  selectedDate = dateStr;
  calendarExpanded = false;
  document.getElementById("calendarMonth").classList.add("hidden");
  renderWeek();
  renderDaySessions();
}

/* ---------- TOGGLE ---------- */
document.getElementById("toggleCalendarBtn").onclick = () => {
  calendarExpanded = !calendarExpanded;
  document.getElementById("calendarMonth")
    .classList.toggle("hidden", !calendarExpanded);
};

/* ---------- MONTH NAV ---------- */
document.getElementById("prevMonth").onclick = () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderMonth();
};

document.getElementById("nextMonth").onclick = () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderMonth();
};

/* ---------- DAY SESSIONS ---------- */
function renderDaySessions() {
  const list = document.getElementById("programList");
  list.innerHTML = "";

  state.programs.forEach(program => {
    const sessions = program.sessions.filter(s => s.date === selectedDate);

    sessions.forEach(session => {
      const percent = Math.round(
        (session.correct / program.totalQuestions) * 100
      );

      list.innerHTML += `
        <article class="program-card" style="background:${program.color}">
          <header class="program-card__header">
            <h3>${program.name}</h3>
            <span class="status-pill">Done</span>
          </header>

          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>

          <div class="program-stats">
            <span>${session.correct} of ${program.totalQuestions}</span>
            <span>${percent}%</span>
          </div>
        </article>
      `;
    });
  });
}

/* ---------- INIT ---------- */
renderWeek();
renderMonth();
renderDaySessions();
