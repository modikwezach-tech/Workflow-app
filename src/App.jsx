import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./index.css";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const AVATAR = "/logo192.png";

const priorityColors = { High: "#ff6b6b", Medium: "#ffd166", Low: "#4fffb0" };

const formatTime = (s) => {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const formatDur = (s) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
};

const TODAY = new Date();

const callClaude = async (system, userMsg) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system, messages: [{ role: "user", content: userMsg }] })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

const Icons = {
  tasks: (a) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  projects: (a) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  timer: (a) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" /></svg>,
  analytics: (a) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>,
  email: (a) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>,
};

export default function App() {
  const [tab, setTab] = useState("tasks");
  const [toast, setToast] = useState(null);

  const [tasks, setTasks] = useState([
    { id: 1, name: "Review Q2 design specs", done: false, priority: "High", project: "Product Launch", due: "2026-02-21" },
    { id: 2, name: "Prepare weekly stand-up notes", done: false, priority: "Medium", project: "Team", due: "2026-02-22" },
    { id: 3, name: "Send client proposal", done: true, priority: "High", project: "Sales", due: "2026-02-20" },
    { id: 4, name: "Update project roadmap", done: false, priority: "Low", project: "Product Launch", due: "2026-02-25" },
  ]);

  const [projects, setProjects] = useState([
    { id: 1, name: "Product Launch", progress: 68, tasks: 12, done: 8, color: "#4fffb0" },
    { id: 2, name: "Website Redesign", progress: 35, tasks: 20, done: 7, color: "#74b9ff" },
    { id: 3, name: "Sales Pipeline", progress: 90, tasks: 8, done: 7, color: "#ffd166" },
  ]);

  const [timeLog, setTimeLog] = useState([
    { id: 1, task: "Design review", duration: 3600, date: "2026-02-20" },
    { id: 2, task: "Client call", duration: 2700, date: "2026-02-20" },
    { id: 3, task: "Planning", duration: 5400, date: "2026-02-19" },
    { id: 4, task: "Development", duration: 7200, date: "2026-02-18" },
  ]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const addTaskFromAI = (taskName) => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    setTasks(prev => [...prev, { id: Date.now(), name: taskName, done: false, priority: "Medium", project: "Inbox", due: tomorrow.toISOString().split("T")[0] }]);
    showToast("Task added ✓");
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="app-root">
      <div className="app-header">
        <div className="header-row">
          <div>
            <div className="greeting">{greeting}, <span>Zach</span> 👋</div>
            <div className="sub-greeting">{TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
          </div>
          <img src={AVATAR} className="avatar" alt="Zach" />
        </div>
      </div>

      <div className="page">
        {tab === "tasks" && <TasksPage tasks={tasks} setTasks={setTasks} projects={projects} showToast={showToast} />}
        {tab === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} tasks={tasks} showToast={showToast} />}
        {tab === "timer" && <TimerCalendarPage tasks={tasks} setTasks={setTasks} timeLog={timeLog} setTimeLog={setTimeLog} showToast={showToast} />}
        {tab === "analytics" && <AnalyticsPage tasks={tasks} timeLog={timeLog} showToast={showToast} />}
        {tab === "email" && <EmailPage addTaskFromAI={addTaskFromAI} showToast={showToast} />}
      </div>

      <nav className="nav-bar">
        {[{ id: "tasks", label: "Tasks" }, { id: "projects", label: "Projects" }, { id: "timer", label: "Calendar" }, { id: "analytics", label: "Analytics" }, { id: "email", label: "AI Email" }].map(({ id, label }) => (
          <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            {Icons[id](tab === id)}{label}
          </button>
        ))}
      </nav>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function TasksPage({ tasks, setTasks, projects, showToast }) {
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [project, setProject] = useState("Inbox");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => { setTasks(prev => prev.filter(t => t.id !== id)); showToast("Task removed"); };
  const add = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), name: newTask, done: false, priority, project, due: dueDate }]);
    setNewTask(""); showToast("Task added ✓");
  };

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-chip"><div className="stat-chip-val accent">{pending.length}</div><div className="stat-chip-label">Pending</div></div>
        <div className="stat-chip"><div className="stat-chip-val red">{tasks.filter(t => t.priority === "High" && !t.done).length}</div><div className="stat-chip-label">Urgent</div></div>
        <div className="stat-chip"><div className="stat-chip-val yellow">{done.length}</div><div className="stat-chip-label">Done</div></div>
      </div>
      <div className="card">
        <div className="input-row">
          <input className="text-input" placeholder="Add a task…" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          <button className="btn-icon" onClick={add}>{Icons.plus()}</button>
        </div>
        <div className="add-task-row">
          <select className="select-sm" value={priority} onChange={e => setPriority(e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select>
          <select className="select-sm" value={project} onChange={e => setProject(e.target.value)}>
            <option>Inbox</option>{projects.map(p => <option key={p.id}>{p.name}</option>)}
          </select>
          <input type="date" className="select-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>
      {pending.length > 0 && <div className="card"><div className="card-header"><div className="section-title">To Do</div><div className="badge">{pending.length}</div></div>{pending.map(t => <TaskItem key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}</div>}
      {done.length > 0 && <div className="card"><div className="card-header"><div className="section-title">Completed</div><div className="badge green">{done.length}</div></div>{done.map(t => <TaskItem key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}</div>}
    </div>
  );
}

function TaskItem({ task, onToggle, onRemove }) {
  const due = task.due ? new Date(task.due + "T00:00:00") : null;
  const isOverdue = due && due < TODAY && !task.done;
  const dueLabel = due ? due.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  return (
    <div className="task-item">
      <div className="priority-dot" style={{ background: priorityColors[task.priority] }} />
      <button className={`task-check ${task.done ? "done" : ""}`} onClick={() => onToggle(task.id)}>
        {task.done && <svg viewBox="0 0 24 24" fill="none" stroke="#0d0f14" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><polyline points="20 6 9 17 4 12" /></svg>}
      </button>
      <div className="task-text">
        <div className={`task-name ${task.done ? "done" : ""}`}>{task.name}</div>
        <div className="task-meta">{task.project} · <span style={{ color: isOverdue ? "var(--accent2)" : "inherit" }}>{isOverdue ? "Overdue " : "Due "}{dueLabel}</span></div>
      </div>
      <button onClick={() => onRemove(task.id)} className="icon-btn">{Icons.trash()}</button>
    </div>
  );
}

function ProjectsPage({ projects, setProjects, tasks, showToast }) {
  const [newProj, setNewProj] = useState("");
  const add = () => {
    if (!newProj.trim()) return;
    const colors = ["#4fffb0", "#74b9ff", "#ffd166", "#ff6b6b", "#c39ef7"];
    setProjects(prev => [...prev, { id: Date.now(), name: newProj, progress: 0, tasks: 0, done: 0, color: colors[prev.length % colors.length] }]);
    setNewProj(""); showToast("Project created ✓");
  };
  return (
    <div>
      <div className="card">
        <div className="input-row">
          <input className="text-input" placeholder="New project…" value={newProj} onChange={e => setNewProj(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          <button className="btn-icon" onClick={add}>{Icons.plus()}</button>
        </div>
      </div>
      {projects.map(p => {
        const pt = tasks.filter(t => t.project === p.name);
        const dt = pt.filter(t => t.done).length;
        const pct = pt.length > 0 ? Math.round((dt / pt.length) * 100) : p.progress;
        return (
          <div className="proj-card" key={p.id}>
            <div className="proj-top">
              <div><div className="proj-name">{p.name}</div><div className="proj-meta">{pt.length || p.tasks} tasks · {dt || p.done} done</div></div>
              <div className="proj-pct" style={{ color: p.color }}>{pct}%</div>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${p.color},${p.color}99)` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function TimerCalendarPage({ tasks, setTasks, timeLog, setTimeLog, showToast }) {
  const [subTab, setSubTab] = useState("timer");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTask, setSelectedTask] = useState("");
  const intervalRef = useRef(null);
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (running) { intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = () => { if (!selectedTask) { showToast("Select a task first"); return; } setRunning(true); };
  const pause = () => setRunning(false);
  const stop = () => {
    setRunning(false);
    if (elapsed > 0 && selectedTask) { setTimeLog(prev => [...prev, { id: Date.now(), task: selectedTask, duration: elapsed, date: new Date().toISOString().split("T")[0] }]); showToast(`Logged ${formatDur(elapsed)} ✓`); }
    setElapsed(0);
  };

  const todayKey = new Date().toISOString().split("T")[0];
  const totalToday = timeLog.filter(e => e.date === todayKey).reduce((a, b) => a + b.duration, 0);
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const taskDays = new Set(tasks.filter(t => t.due).map(t => {
    const d = new Date(t.due + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
  }).filter(Boolean));

  const selectedDayTasks = selectedDay ? tasks.filter(t => {
    if (!t.due) return false;
    const d = new Date(t.due + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  }) : [];

  const toggleTask = (id) => setTasks(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const removeTask = (id) => { setTasks(prev => prev.filter(x => x.id !== id)); showToast("Task removed"); };

  return (
    <div>
      <div className="tab-switch">
        <button className={`tab-switch-btn ${subTab === "timer" ? "active" : ""}`} onClick={() => setSubTab("timer")}>⏱ Timer</button>
        <button className={`tab-switch-btn ${subTab === "cal" ? "active" : ""}`} onClick={() => setSubTab("cal")}>📅 Calendar</button>
      </div>
      {subTab === "timer" && (
        <>
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>{running && <span className="pulse" />}{running ? "Tracking…" : "Time Tracker"}</div>
            <select className="timer-task-sel" value={selectedTask} onChange={e => setSelectedTask(e.target.value)} disabled={running}>
              <option value="">Select a task…</option>
              {tasks.filter(t => !t.done).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <div className="timer-display">
              <div className="timer-clock">{formatTime(elapsed)}</div>
              <div className="timer-label">{selectedTask || "No task selected"}</div>
            </div>
            <div className="timer-controls">
              {!running ? <button className="btn btn-primary" onClick={start}>▶ Start</button> : <button className="btn btn-secondary" onClick={pause}>⏸ Pause</button>}
              <button className="btn btn-danger" onClick={stop} disabled={elapsed === 0}>■ Stop & Log</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="section-title">Today's Log</div><div className="badge blue">{formatDur(totalToday)}</div></div>
            {timeLog.filter(e => e.date === todayKey).length === 0 && <div className="empty-state"><div className="empty-state-icon">⏱</div>No time logged today</div>}
            {timeLog.filter(e => e.date === todayKey).map(entry => (
              <div key={entry.id} className="time-entry"><span className="time-entry-name">{entry.task}</span><span className="time-entry-dur">{formatDur(entry.duration)}</span></div>
            ))}
          </div>
        </>
      )}
      {subTab === "cal" && (
        <>
          <div className="card">
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={() => setCalDate(new Date(year, month - 1, 1))}>‹</button>
              <div className="cal-month">{monthNames[month]} {year}</div>
              <button className="cal-nav-btn" onClick={() => setCalDate(new Date(year, month + 1, 1))}>›</button>
            </div>
            <div className="cal-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="cal-day-label">{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day empty">0</div>)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = year === TODAY.getFullYear() && month === TODAY.getMonth() && day === TODAY.getDate();
                return (
                  <button key={day} className={`cal-day ${isToday ? "today" : ""} ${selectedDay === day && !isToday ? "selected" : ""} ${taskDays.has(day) ? "has-task" : ""}`} onClick={() => setSelectedDay(selectedDay === day ? null : day)}>{day}</button>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="section-title">{selectedDay ? `${monthNames[month]} ${selectedDay}` : "Upcoming Tasks"}</div>
              <div className="badge">{selectedDay ? selectedDayTasks.length : tasks.filter(t => !t.done && t.due).length}</div>
            </div>
            {selectedDay
              ? (selectedDayTasks.length === 0 ? <div className="empty-state">No tasks due this day</div> : selectedDayTasks.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onRemove={removeTask} />))
              : tasks.filter(t => !t.done && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6).map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onRemove={removeTask} />)
            }
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsPage({ tasks, timeLog, showToast }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalTracked = timeLog.reduce((a, b) => a + b.duration, 0);

  const strengths = [
    { label: "High Priority", pct: tasks.filter(t => t.priority === "High").length > 0 ? Math.round((tasks.filter(t => t.done && t.priority === "High").length / tasks.filter(t => t.priority === "High").length) * 100) : 0, color: "#ff6b6b" },
    { label: "Medium Priority", pct: tasks.filter(t => t.priority === "Medium").length > 0 ? Math.round((tasks.filter(t => t.done && t.priority === "Medium").length / tasks.filter(t => t.priority === "Medium").length) * 100) : 0, color: "#ffd166" },
    { label: "Low Priority", pct: tasks.filter(t => t.priority === "Low").length > 0 ? Math.round((tasks.filter(t => t.done && t.priority === "Low").length / tasks.filter(t => t.priority === "Low").length) * 100) : 0, color: "#4fffb0" },
    { label: "Overall", pct: completionRate, color: "#74b9ff" },
  ];

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const key = d.toISOString().split("T")[0];
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), hours: parseFloat((timeLog.filter(e => e.date === key).reduce((a, b) => a + b.duration, 0) / 3600).toFixed(1)) };
  });

  const weakPoints = strengths.filter(s => s.pct < 50).map(s => s.label);
  const strongPoints = strengths.filter(s => s.pct >= 70).map(s => s.label);

  const getAI = async () => {
    setAiLoading(true);
    try {
      const result = await callClaude(
        `You are a productivity coach. Respond ONLY in valid JSON: {"suggestions":[{"icon":"emoji","title":"short title","text":"1-2 sentence advice"}],"weeklyGoal":"one encouraging sentence","focus":"single most important thing today"}. Limit to 3 suggestions.`,
        `Stats: ${done}/${total} tasks done (${completionRate}%), weak: ${weakPoints.join(",") || "none"}, strong: ${strongPoints.join(",") || "none"}, tracked: ${formatDur(totalTracked)}. Pending: ${tasks.filter(t => !t.done).map(t => t.name).join(", ") || "none"}.`
      );
      setAiSuggestions(result);
    } catch (e) { showToast("Could not load suggestions"); }
    setAiLoading(false);
  };

  return (
    <div>
      <div className="stats-row">
        <div className="stat-chip"><div className="stat-chip-val accent">{completionRate}%</div><div className="stat-chip-label">Complete</div></div>
        <div className="stat-chip"><div className="stat-chip-val yellow">{formatDur(totalTracked)}</div><div className="stat-chip-label">Tracked</div></div>
        <div className="stat-chip"><div className="stat-chip-val blue">{done}</div><div className="stat-chip-label">Done</div></div>
      </div>
      <div className="card">
        <div className="card-header"><div className="section-title">Daily Hours</div><div className="badge blue">7 days</div></div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={last7} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: "#636a82", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#636a82", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1c2030", border: "1px solid #252a38", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#4fffb0" }} />
            <Bar dataKey="hours" fill="#4fffb0" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="card-header"><div className="section-title">Strengths & Weaknesses</div></div>
        {strengths.map(s => (
          <div key={s.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
              <span style={{ fontWeight: 500 }}>{s.label}</span>
              <span style={{ color: s.color, fontFamily: "Syne,sans-serif", fontWeight: 700 }}>{s.pct}%</span>
            </div>
            <div className="strength-bar"><div className="strength-fill" style={{ width: `${s.pct}%`, background: `linear-gradient(90deg,${s.color},${s.color}88)` }} /></div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {strongPoints.map(s => <span key={s} className="badge green">💪 {s}</span>)}
          {weakPoints.map(s => <span key={s} className="badge red">📍 {s}</span>)}
        </div>
      </div>
      {!aiSuggestions && <button className="btn btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={getAI} disabled={aiLoading}>{aiLoading ? "Analyzing…" : "✦ Get AI Coaching"}</button>}
      {aiLoading && <div className="card"><div className="loading-dots"><span /><span /><span /></div></div>}
      {aiSuggestions && (
        <div className="ai-suggestion-box">
          <div className="ai-sug-title">✦ AI Coaching for Zach</div>
          {aiSuggestions.focus && <div className="focus-box">🎯 Focus today: {aiSuggestions.focus}</div>}
          {aiSuggestions.suggestions?.map((s, i) => (
            <div key={i} className="ai-sug-item">
              <span className="ai-sug-icon">{s.icon}</span>
              <div><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{s.title}</div><div style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.55 }}>{s.text}</div></div>
            </div>
          ))}
          {aiSuggestions.weeklyGoal && <div className="weekly-goal">💬 {aiSuggestions.weeklyGoal}</div>}
          <button className="btn btn-secondary" style={{ fontSize: 11, padding: "7px 14px", marginTop: 10 }} onClick={() => setAiSuggestions(null)}>Refresh</button>
        </div>
      )}
    </div>
  );
}

function EmailPage({ addTaskFromAI, showToast }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [addedTasks, setAddedTasks] = useState(new Set());

  const analyze = async () => {
    if (!email.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await callClaude(
        `Analyze emails. Respond ONLY with valid JSON: {"summary":"2-3 sentence overview","tasks":["task1"],"requirements":["req1"],"howToDo":["step1"],"deadline":"deadline or null","priority":"High|Medium|Low"}`,
        `Analyze this email:\n\n${email}`
      );
      setResult(r);
    } catch (e) { showToast("Analysis failed — try again"); }
    setLoading(false);
  };

  const handleAdd = (task) => { addTaskFromAI(task); setAddedTasks(prev => new Set([...prev, task])); };

  return (
    <div>
      <div className="card">
        <div className="card-header"><div className="section-title">AI Email Analyzer</div><div className="badge green">✦ AI</div></div>
        <textarea className="email-textarea" placeholder="Paste your email here…" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={analyze} disabled={loading || !email.trim()}>{loading ? "Analyzing…" : "✦ Analyze Email"}</button>
      </div>
      {loading && <div className="card"><div className="loading-dots"><span /><span /><span /></div></div>}
      {result && (
        <div className="ai-result">
          <div className="ai-result-title">✦ Analysis · <span className={`badge ${result.priority === "High" ? "red" : result.priority === "Low" ? "green" : "yellow"}`}>{result.priority} Priority</span></div>
          <div className="ai-section-label">📝 Summary</div><div className="ai-text">{result.summary}</div>
          {result.deadline && <><div className="ai-section-label">📅 Deadline</div><div className="ai-text">{result.deadline}</div></>}
          {result.tasks?.length > 0 && <><div className="ai-section-label">✅ Tasks — tap to add</div><div>{result.tasks.map((t, i) => <button key={i} className="ai-task-chip" onClick={() => handleAdd(t)} disabled={addedTasks.has(t)} style={addedTasks.has(t) ? { opacity: 0.5 } : {}}>{addedTasks.has(t) ? "✓" : "+"} {t}</button>)}</div></>}
          {result.requirements?.length > 0 && <><div className="ai-section-label">📌 Requirements</div>{result.requirements.map((r, i) => <div key={i} className="ai-text" style={{ marginBottom: 3 }}>• {r}</div>)}</>}
          {result.howToDo?.length > 0 && <><div className="ai-section-label">🗺 Action Plan</div>{result.howToDo.map((s, i) => <div key={i} className="ai-text" style={{ marginBottom: 5 }}><strong style={{ color: "var(--accent)" }}>{i + 1}.</strong> {s}</div>)}</>}
        </div>
      )}
      {!result && !loading && <div className="card" style={{ textAlign: "center", padding: "22px 18px" }}><div style={{ fontSize: 34, marginBottom: 9 }}>📧</div><div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>Paste any work email and AI will extract tasks, deadlines, requirements, and give you a clear action plan.</div></div>}
    </div>
  );
}
