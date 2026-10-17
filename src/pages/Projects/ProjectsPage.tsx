import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  CURRENT_USER,
  PROJECT_STATUSES,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  mockProjects,
  toDateKey,
} from "./mockProjects";
import "./projects.css";

type BuiltInView =
  | "active"
  | "board"
  | "task-calendar"
  | "gantt"
  | "my-tasks"
  | "my-calendar"
  | "overdue";

interface CustomList {
  id: string;
  name: string;
  status: ProjectStatus | "All";
  owner: string | "All";
}

type SortKey = "id" | "name" | "target" | "progress";

const PAGE_SIZE = 3;
const STORAGE_PROJECTS = "servigen.projects.v1";
const STORAGE_LISTS = "servigen.projectLists.v1";

const MY_LISTS: { id: BuiltInView; label: string; icon: string }[] = [
  { id: "active", label: "Active Projects", icon: "▤" },
  { id: "board", label: "Project Board", icon: "▦" },
  { id: "task-calendar", label: "Task Calendar", icon: "▭" },
  { id: "gantt", label: "Project Gantt View", icon: "≡" },
];

const MY_PROJECTS: { id: BuiltInView; label: string; icon: string }[] = [
  { id: "my-tasks", label: "My Tasks", icon: "☐" },
  { id: "my-calendar", label: "My Calendar", icon: "▭" },
  { id: "overdue", label: "Overdue Tasks", icon: "◷" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/* ---------- helpers ---------- */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the page still works in memory.
  }
}

function parseDate(key: string) {
  return new Date(`${key}T00:00`);
}

function formatDate(key: string) {
  return parseDate(key).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatHours(h: number) {
  return `${Number.isInteger(h) ? h : h.toFixed(2)}h`;
}

function progress(p: Project) {
  if (p.status === "Completed") return 100;
  if (p.tasks.length === 0) return 0;
  return Math.round((p.tasks.filter((t) => t.done).length / p.tasks.length) * 100);
}

function progressTone(pct: number) {
  if (pct >= 60) return "good";
  if (pct >= 30) return "mid";
  return "low";
}

function statusClass(s: ProjectStatus) {
  return s.toLowerCase().replace(" ", "-");
}

function isOverdue(t: ProjectTask) {
  return !t.done && t.dueDate < toDateKey(new Date());
}

const emptyProjectForm = {
  name: "",
  owner: CURRENT_USER,
  description: "",
  status: "New" as ProjectStatus,
  priority: "Medium" as ProjectPriority,
  startDate: toDateKey(new Date()),
  targetDate: toDateKey(new Date(Date.now() + 30 * 86_400_000)),
  hoursBudget: 100,
  tasks: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(() => load(STORAGE_PROJECTS, mockProjects));
  const [customLists, setCustomLists] = useState<CustomList[]>(() => load(STORAGE_LISTS, []));
  const [activeView, setActiveView] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyProjectForm);
  const [formError, setFormError] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [listForm, setListForm] = useState<Omit<CustomList, "id">>({ name: "", status: "All", owner: "All" });
  const [calMonth, setCalMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [newTask, setNewTask] = useState("");
  const [logHours, setLogHours] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => save(STORAGE_PROJECTS, projects), [projects]);
  useEffect(() => save(STORAGE_LISTS, customLists), [customLists]);
  useEffect(() => setPage(0), [activeView, search, sortBy]);

  const owners = useMemo(() => Array.from(new Set(projects.map((p) => p.owner))).sort(), [projects]);
  const customList = customLists.find((l) => `custom:${l.id}` === activeView);
  const detail = projects.find((p) => p.id === detailId) ?? null;

  /* ---------- filtering ---------- */

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.tasks.some((t) => t.title.toLowerCase().includes(q) || String(t.id).includes(q))
    );
  }, [projects, search]);

  const listed = useMemo(() => {
    let result = searched;
    if (customList) {
      result = result.filter(
        (p) =>
          (customList.status === "All" || p.status === customList.status) &&
          (customList.owner === "All" || p.owner === customList.owner)
      );
    } else if (activeView === "active") {
      result = result.filter((p) => p.status !== "Completed");
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "target") return a.targetDate.localeCompare(b.targetDate);
      if (sortBy === "progress") return progress(b) - progress(a);
      return b.id - a.id;
    });
    return sorted;
  }, [searched, customList, activeView, sortBy]);

  const allTasks = useMemo(
    () => searched.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p }))),
    [searched]
  );

  const isCardView = activeView === "active" || Boolean(customList);
  const pageCount = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const pageItems = listed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = listed.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(listed.length, (page + 1) * PAGE_SIZE);

  /* ---------- mutations ---------- */

  function updateProject(id: number, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function toggleTask(projectId: number, taskId: number) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : p
      )
    );
  }

  function nextTaskId() {
    return Math.max(0, ...projects.flatMap((p) => p.tasks.map((t) => t.id))) + 1;
  }

  function addTask(project: Project) {
    const title = newTask.trim();
    if (!title) return;
    const t: ProjectTask = { id: nextTaskId(), title, assignee: CURRENT_USER, dueDate: project.targetDate, done: false };
    updateProject(project.id, { tasks: [...project.tasks, t] });
    setNewTask("");
  }

  function deleteProject(id: number) {
    if (!window.confirm("Delete this project?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDetailId(null);
  }

  function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.owner.trim()) return setFormError("Project name and owner are required.");
    if (form.targetDate < form.startDate) return setFormError("Target date must be after the start date.");
    const id = Math.max(0, ...projects.map((p) => p.id)) + 1;
    let taskId = nextTaskId();
    const tasks = form.tasks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title) => ({ id: taskId++, title, assignee: form.owner.trim(), dueDate: form.targetDate, done: false }));
    const project: Project = {
      id,
      name: form.name.trim(),
      owner: form.owner.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      startDate: form.startDate,
      targetDate: form.targetDate,
      hoursSpent: 0,
      hoursBudget: Math.max(1, form.hoursBudget),
      tasks,
    };
    setProjects((prev) => [project, ...prev]);
    setShowNew(false);
    setForm(emptyProjectForm);
    setSortBy("id");
    setActiveView("active");
  }

  function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!listForm.name.trim()) return;
    const list: CustomList = { ...listForm, name: listForm.name.trim(), id: String(Date.now()) };
    setCustomLists((prev) => [...prev, list]);
    setActiveView(`custom:${list.id}`);
    setShowNewList(false);
    setListForm({ name: "", status: "All", owner: "All" });
  }

  function removeList(id: string) {
    setCustomLists((prev) => prev.filter((l) => l.id !== id));
    if (activeView === `custom:${id}`) setActiveView("active");
  }

  function resetData() {
    if (!window.confirm("Reset all projects to the sample data?")) return;
    setProjects(mockProjects);
    setCustomLists([]);
    setActiveView("active");
    setMenuOpen(false);
  }

  /* ---------- views ---------- */

  function renderCard(p: Project) {
    const pct = progress(p);
    const timePct = Math.min(100, (p.hoursSpent / p.hoursBudget) * 100);
    const shown = p.tasks.slice(0, 6);
    return (
      <article key={p.id} className="pj-card" onClick={() => setDetailId(p.id)}>
        <div className="pj-card-main">
          <div className="pj-card-title">
            <h2>{p.name}</h2>
            <span className="pj-id">#{p.id}</span>
          </div>
          <p className="pj-owner">{p.owner}</p>
          <div className="pj-badges">
            <span className={`pj-badge pct ${progressTone(pct)}`}>{pct}% COMPLETE</span>
            <span className={`pj-badge status ${statusClass(p.status)}`}>{p.status.toUpperCase()}</span>
          </div>
        </div>

        <div className="pj-card-timeline">
          <h3>Timeline</h3>
          <div className="pj-dates">
            <div>
              <span>Start</span>
              <strong>{formatDate(p.startDate)}</strong>
            </div>
            <div>
              <span>Target</span>
              <strong>{formatDate(p.targetDate)}</strong>
            </div>
          </div>
          <span className="pj-label">Time Spent</span>
          <strong className="pj-hours">
            {formatHours(p.hoursSpent)} / {formatHours(p.hoursBudget)}
          </strong>
          <div className="pj-bar">
            <div style={{ width: `${timePct}%` }} />
          </div>
        </div>

        <div className="pj-card-tasks">
          {shown.map((t) => (
            <div key={t.id} className={`pj-task-chip ${t.done ? "done" : ""} ${isOverdue(t) ? "overdue" : ""}`}>
              <strong>
                #{t.id} {t.done && "✓"}
              </strong>
              <span>{t.title}</span>
            </div>
          ))}
          {p.tasks.length > 6 && <div className="pj-task-chip more">+{p.tasks.length - 6} more</div>}
          {p.tasks.length === 0 && <div className="pj-task-chip empty">No tasks yet</div>}
        </div>
      </article>
    );
  }

  function renderBoard() {
    return (
      <div className="pj-board">
        {PROJECT_STATUSES.map((status) => {
          const items = searched.filter((p) => p.status === status);
          return (
            <div key={status} className="pj-board-col">
              <div className="pj-board-head">
                <span className={`pj-badge status ${statusClass(status)}`}>{status.toUpperCase()}</span>
                <span className="pj-count">{items.length}</span>
              </div>
              {items.map((p) => (
                <button key={p.id} className="pj-board-card" onClick={() => setDetailId(p.id)}>
                  <span className="pj-id small">#{p.id}</span>
                  <strong>{p.name}</strong>
                  <span className="pj-muted">{p.owner}</span>
                  <div className="pj-bar thin">
                    <div style={{ width: `${progress(p)}%` }} />
                  </div>
                  <span className="pj-muted">{progress(p)}% · due {formatDate(p.targetDate)}</span>
                </button>
              ))}
              {items.length === 0 && <p className="pj-muted pj-board-empty">Nothing here</p>}
            </div>
          );
        })}
      </div>
    );
  }

  function renderTaskCalendar(mineOnly: boolean) {
    const first = new Date(calMonth);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    const tasks = mineOnly ? allTasks.filter((t) => t.assignee === CURRENT_USER) : allTasks;
    const todayKey = toDateKey(new Date());
    return (
      <div className="pj-cal">
        <div className="pj-cal-toolbar">
          <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>‹</button>
          <strong>{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
          <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>›</button>
          <button
            className="pj-link"
            onClick={() => setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          >
            Today
          </button>
        </div>
        <div className="pj-cal-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pj-cal-head">
              {w}
            </div>
          ))}
          {days.map((d) => {
            const key = toDateKey(d);
            const dayTasks = tasks.filter((t) => t.dueDate === key);
            return (
              <div
                key={key}
                className={`pj-cal-cell ${d.getMonth() !== calMonth.getMonth() ? "outside" : ""} ${
                  key === todayKey ? "today" : ""
                }`}
              >
                <span className="pj-cal-num">{d.getDate()}</span>
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    className={`pj-cal-task ${t.done ? "done" : ""} ${isOverdue(t) ? "overdue" : ""}`}
                    title={`${t.project.name} – ${t.title}`}
                    onClick={() => setDetailId(t.project.id)}
                  >
                    #{t.id} {t.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderGantt() {
    const items = searched;
    if (items.length === 0) return <div className="pj-empty">No projects match your search.</div>;
    const min = Math.min(...items.map((p) => parseDate(p.startDate).getTime()));
    const max = Math.max(...items.map((p) => parseDate(p.targetDate).getTime()));
    const span = Math.max(max - min, 86_400_000);
    const pos = (t: number) => ((t - min) / span) * 100;
    const todayPos = pos(parseDate(toDateKey(new Date())).getTime());
    const months: Date[] = [];
    for (let m = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1); m.getTime() <= max; m.setMonth(m.getMonth() + 1)) {
      months.push(new Date(m));
    }
    return (
      <div className="pj-gantt">
        <div className="pj-gantt-row pj-gantt-scale">
          <div className="pj-gantt-name" />
          <div className="pj-gantt-track">
            {months.map((m) => (
              <span key={m.toISOString()} style={{ left: `${Math.max(0, pos(m.getTime()))}%` }}>
                {m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </span>
            ))}
          </div>
        </div>
        {items.map((p) => {
          const left = pos(parseDate(p.startDate).getTime());
          const width = Math.max(pos(parseDate(p.targetDate).getTime()) - left, 1.5);
          return (
            <div key={p.id} className="pj-gantt-row">
              <button className="pj-gantt-name" onClick={() => setDetailId(p.id)}>
                <strong>{p.name}</strong>
                <span className="pj-muted">#{p.id}</span>
              </button>
              <div className="pj-gantt-track">
                {todayPos >= 0 && todayPos <= 100 && <div className="pj-gantt-today" style={{ left: `${todayPos}%` }} />}
                <button
                  className={`pj-gantt-bar ${statusClass(p.status)}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${formatDate(p.startDate)} → ${formatDate(p.targetDate)}`}
                  onClick={() => setDetailId(p.id)}
                >
                  <span className="pj-gantt-fill" style={{ width: `${progress(p)}%` }} />
                  <span className="pj-gantt-label">{progress(p)}%</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTaskTable(mode: "mine" | "overdue") {
    const tasks = (mode === "mine" ? allTasks.filter((t) => t.assignee === CURRENT_USER) : allTasks.filter(isOverdue)).sort(
      (a, b) => a.dueDate.localeCompare(b.dueDate)
    );
    if (tasks.length === 0) {
      return <div className="pj-empty">{mode === "mine" ? "No tasks assigned to you." : "Nothing is overdue. 🎉"}</div>;
    }
    return (
      <div className="pj-table">
        <div className="pj-table-row head">
          <span />
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Due</span>
        </div>
        {tasks.map((t) => (
          <div key={t.id} className={`pj-table-row ${t.done ? "done" : ""}`}>
            <input
              type="checkbox"
              checked={t.done}
              aria-label={`Mark ${t.title} done`}
              onChange={() => toggleTask(t.project.id, t.id)}
            />
            <span>
              <strong>#{t.id}</strong> {t.title}
            </span>
            <button className="pj-link" onClick={() => setDetailId(t.project.id)}>
              {t.project.name}
            </button>
            <span>{t.assignee}</span>
            <span className={isOverdue(t) ? "pj-overdue" : ""}>{formatDate(t.dueDate)}</span>
          </div>
        ))}
      </div>
    );
  }

  const viewTitles: Record<BuiltInView, [string, string]> = {
    active: ["Projects", "Manage and track your active projects"],
    board: ["Project Board", "Projects grouped by status"],
    "task-calendar": ["Task Calendar", "Every task by due date"],
    gantt: ["Project Gantt View", "Project timelines at a glance"],
    "my-tasks": ["My Tasks", `Tasks assigned to ${CURRENT_USER}`],
    "my-calendar": ["My Calendar", "Your tasks by due date"],
    overdue: ["Overdue Tasks", "Open tasks past their due date"],
  };
  const [title, subtitle] = customList
    ? [customList.name, "Custom list"]
    : viewTitles[activeView as BuiltInView] ?? viewTitles.active;

  return (
    <div className="projects-page">
      <aside className="pj-side">
        <div className="pj-search">
          <input
            ref={searchRef}
            placeholder="Search Projects...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            aria-label={search ? "Clear search" : "Search"}
            onClick={() => (search ? setSearch("") : searchRef.current?.focus())}
          >
            {search ? "✕" : "⌕"}
          </button>
        </div>

        <h3>My Lists</h3>
        {MY_LISTS.map((item) => (
          <button
            key={item.id}
            className={`pj-nav ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="pj-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        {customLists.map((l) => (
          <div key={l.id} className={`pj-nav custom ${activeView === `custom:${l.id}` ? "active" : ""}`}>
            <button onClick={() => setActiveView(`custom:${l.id}`)}>
              <span className="pj-nav-icon">☆</span>
              {l.name}
            </button>
            <button className="pj-nav-remove" aria-label={`Remove ${l.name}`} onClick={() => removeList(l.id)}>
              ✕
            </button>
          </div>
        ))}

        <h3>My Projects</h3>
        {MY_PROJECTS.map((item) => (
          <button
            key={item.id}
            className={`pj-nav ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="pj-nav-icon">{item.icon}</span>
            {item.label}
            {item.id === "overdue" && allTasks.filter(isOverdue).length > 0 && (
              <span className="pj-nav-count">{allTasks.filter(isOverdue).length}</span>
            )}
          </button>
        ))}

        <button className="pj-create-list" onClick={() => setShowNewList(true)}>
          ↳ Create a New list
        </button>
      </aside>

      <main className="pj-main">
        <header className="pj-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="pj-header-actions">
            {isCardView && (
              <>
                <span className="pj-range">
                  {rangeStart}-{rangeEnd} of {listed.length}
                </span>
                <button
                  className="pj-circle"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  ←
                </button>
                <button
                  className="pj-circle"
                  aria-label="Next page"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage(page + 1)}
                >
                  →
                </button>
              </>
            )}
            <button className="pj-new" onClick={() => setShowNew(true)}>
              + New
            </button>
            <div className="pj-menu-wrap">
              <button className="pj-circle" aria-label="More options" onClick={() => setMenuOpen(!menuOpen)}>
                ⋮
              </button>
              {menuOpen && (
                <div className="pj-menu" onMouseLeave={() => setMenuOpen(false)}>
                  <span className="pj-menu-label">Sort by</span>
                  {(
                    [
                      ["id", "Newest first"],
                      ["name", "Name"],
                      ["target", "Target date"],
                      ["progress", "Progress"],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      className={sortBy === key ? "active" : ""}
                      onClick={() => {
                        setSortBy(key);
                        setMenuOpen(false);
                      }}
                    >
                      {sortBy === key ? "✓ " : ""}
                      {label}
                    </button>
                  ))}
                  <hr />
                  <button onClick={resetData}>Reset sample data</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isCardView &&
          (pageItems.length === 0 ? (
            <div className="pj-empty">No projects found. Try another search or create a new project.</div>
          ) : (
            <div className="pj-list">{pageItems.map(renderCard)}</div>
          ))}
        {activeView === "board" && renderBoard()}
        {activeView === "task-calendar" && renderTaskCalendar(false)}
        {activeView === "my-calendar" && renderTaskCalendar(true)}
        {activeView === "gantt" && renderGantt()}
        {activeView === "my-tasks" && renderTaskTable("mine")}
        {activeView === "overdue" && renderTaskTable("overdue")}
      </main>

      {/* PROJECT DETAILS */}
      {detail && (
        <div className="pj-overlay" onClick={() => setDetailId(null)}>
          <div className="pj-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="pj-modal-head">
              <div>
                <span className="pj-id">#{detail.id}</span>
                <h2>{detail.name}</h2>
                <p className="pj-muted">{detail.description || "No description"}</p>
              </div>
              <button className="pj-close" aria-label="Close" onClick={() => setDetailId(null)}>
                ✕
              </button>
            </div>

            <div className="pj-detail-grid">
              <label>
                Status
                <select
                  value={detail.status}
                  onChange={(e) => updateProject(detail.id, { status: e.target.value as ProjectStatus })}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={detail.priority}
                  onChange={(e) => updateProject(detail.id, { priority: e.target.value as ProjectPriority })}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <div>
                <span>Owner</span>
                <strong>{detail.owner}</strong>
              </div>
              <div>
                <span>Timeline</span>
                <strong>
                  {formatDate(detail.startDate)} → {formatDate(detail.targetDate)}
                </strong>
              </div>
            </div>

            <div className="pj-detail-hours">
              <div className="pj-detail-hours-top">
                <span>
                  Time spent <strong>{formatHours(detail.hoursSpent)}</strong> of {formatHours(detail.hoursBudget)}
                </span>
                <div className="pj-log">
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={logHours}
                    onChange={(e) => setLogHours(Number(e.target.value))}
                  />
                  <button
                    className="pj-btn"
                    onClick={() =>
                      logHours > 0 &&
                      updateProject(detail.id, { hoursSpent: Math.round((detail.hoursSpent + logHours) * 100) / 100 })
                    }
                  >
                    Log hours
                  </button>
                </div>
              </div>
              <div className="pj-bar">
                <div style={{ width: `${Math.min(100, (detail.hoursSpent / detail.hoursBudget) * 100)}%` }} />
              </div>
            </div>

            <h3 className="pj-section-title">
              Tasks <span className="pj-muted">{progress(detail)}% complete</span>
            </h3>
            <div className="pj-checklist">
              {detail.tasks.map((t) => (
                <label key={t.id} className={t.done ? "done" : ""}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(detail.id, t.id)} />
                  <span className="pj-check-title">
                    <strong>#{t.id}</strong> {t.title}
                  </span>
                  <span className="pj-muted">{t.assignee}</span>
                  <span className={isOverdue(t) ? "pj-overdue" : "pj-muted"}>{formatDate(t.dueDate)}</span>
                  <button
                    className="pj-icon-btn"
                    aria-label={`Remove ${t.title}`}
                    onClick={(e) => {
                      e.preventDefault();
                      updateProject(detail.id, { tasks: detail.tasks.filter((x) => x.id !== t.id) });
                    }}
                  >
                    ✕
                  </button>
                </label>
              ))}
            </div>
            <form
              className="pj-add-task"
              onSubmit={(e) => {
                e.preventDefault();
                addTask(detail);
              }}
            >
              <input placeholder="Add a task…" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <button className="pj-btn" type="submit">
                Add
              </button>
            </form>

            <div className="pj-modal-actions">
              <button className="pj-btn danger" onClick={() => deleteProject(detail.id)}>
                Delete project
              </button>
              <button className="pj-btn primary" onClick={() => setDetailId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT */}
      {showNew && (
        <div className="pj-overlay" onClick={() => setShowNew(false)}>
          <form className="pj-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateProject}>
            <div className="pj-modal-head">
              <h2>Create New Project</h2>
              <button type="button" className="pj-close" aria-label="Close" onClick={() => setShowNew(false)}>
                ✕
              </button>
            </div>
            <div className="pj-form">
              <label>
                Project Name *
                <input
                  autoFocus
                  placeholder="e.g. ERP Cloud Migration"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  rows={2}
                  placeholder="Goals, deliverables and scope..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <div className="pj-form-row">
                <label>
                  Owner *
                  <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </label>
                <label>
                  Budget (hours)
                  <input
                    type="number"
                    min={1}
                    value={form.hoursBudget}
                    onChange={(e) => setForm({ ...form, hoursBudget: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div className="pj-form-row">
                <label>
                  Start
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </label>
                <label>
                  Target
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  />
                </label>
              </div>
              <div className="pj-form-row">
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as ProjectPriority })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
              </div>
              <label>
                Tasks (one per line)
                <textarea
                  rows={3}
                  placeholder={"Requirements gathering\nDesign\nRollout"}
                  value={form.tasks}
                  onChange={(e) => setForm({ ...form, tasks: e.target.value })}
                />
              </label>
              {formError && <p className="pj-error">{formError}</p>}
            </div>
            <div className="pj-modal-actions">
              <button type="button" className="pj-btn" onClick={() => setShowNew(false)}>
                Cancel
              </button>
              <button type="submit" className="pj-btn primary">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW LIST */}
      {showNewList && (
        <div className="pj-overlay" onClick={() => setShowNewList(false)}>
          <form className="pj-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateList}>
            <div className="pj-modal-head">
              <h2>Create a New List</h2>
              <button type="button" className="pj-close" aria-label="Close" onClick={() => setShowNewList(false)}>
                ✕
              </button>
            </div>
            <div className="pj-form">
              <label>
                List name *
                <input
                  autoFocus
                  placeholder="e.g. On hold projects"
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                />
              </label>
              <div className="pj-form-row">
                <label>
                  Status
                  <select
                    value={listForm.status}
                    onChange={(e) => setListForm({ ...listForm, status: e.target.value as CustomList["status"] })}
                  >
                    <option value="All">All</option>
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Owner
                  <select value={listForm.owner} onChange={(e) => setListForm({ ...listForm, owner: e.target.value })}>
                    <option value="All">All</option>
                    {owners.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="pj-modal-actions">
              <button type="button" className="pj-btn" onClick={() => setShowNewList(false)}>
                Cancel
              </button>
              <button type="submit" className="pj-btn primary" disabled={!listForm.name.trim()}>
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
