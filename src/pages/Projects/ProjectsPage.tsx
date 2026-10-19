import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Project, type ProjectStatus, type ProjectTask, PROJECT_STATUSES, toDateKey } from "./types";
import { getSessionUserName, loadProjectsScreen } from "./projectsApi";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import "./projects.css";

type View = "active" | "board" | "task-calendar" | "gantt" | "my-tasks" | "my-calendar" | "overdue";
type SortKey = "id" | "name" | "target" | "progress";

const PAGE_SIZE = 3;

// Shown on controls whose backend endpoint is not in the API doc yet.
const NO_API = "Waiting for backend API (not in the API doc yet)";

const MY_LISTS: { id: View; label: string; icon: string }[] = [
  { id: "active", label: "Active Projects", icon: "▤" },
  { id: "board", label: "Project Board", icon: "▦" },
  { id: "task-calendar", label: "Task Calendar", icon: "▭" },
  { id: "gantt", label: "Project Gantt View", icon: "≡" },
];

const MY_PROJECTS: { id: View; label: string; icon: string }[] = [
  { id: "my-tasks", label: "My Tasks", icon: "☐" },
  { id: "my-calendar", label: "My Calendar", icon: "▭" },
  { id: "overdue", label: "Overdue Tasks", icon: "◷" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/* ---------- helpers ---------- */

function parseDate(key: string) {
  return new Date(`${key}T00:00`);
}

function formatDate(key: string) {
  if (!key) return "—";
  return parseDate(key).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatHours(h: number) {
  return `${Number.isInteger(h) ? h : h.toFixed(2)}h`;
}

function progress(p: Project) {
  if (typeof p.completionPercent === "number") return Math.round(Math.min(100, Math.max(0, p.completionPercent)));
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
  return !t.done && Boolean(t.dueDate) && t.dueDate < toDateKey(new Date());
}

function timePercent(p: Project) {
  return p.hoursBudget > 0 ? Math.min(100, (p.hoursSpent / p.hoursBudget) * 100) : 0;
}

function sameName(a: string, b: string) {
  return Boolean(a) && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<View>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, name] = await Promise.all([loadProjectsScreen(), getSessionUserName()]);
      setProjects(data.projects);
      setActiveIds(data.activeIds);
      setUserName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects from the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(0), [activeView, search, sortBy]);

  const detail = projects.find((p) => p.id === detailId) ?? null;

  /* ---------- filtering ---------- */

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.tasks.some((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  }, [projects, search]);

  const listed = useMemo(() => {
    const result = searched.filter((p) => activeIds.includes(p.id));
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "target") return (a.targetDate || "9999").localeCompare(b.targetDate || "9999");
      if (sortBy === "progress") return progress(b) - progress(a);
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });
    return result;
  }, [searched, activeIds, sortBy]);

  const allTasks = useMemo(
    () => searched.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p }))),
    [searched]
  );
  const myTasks = allTasks.filter((t) => sameName(userName, t.assignee));
  const overdueTasks = allTasks.filter(isOverdue);

  const pageCount = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const pageItems = listed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = listed.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(listed.length, (page + 1) * PAGE_SIZE);

  /* ---------- views ---------- */

  function renderCard(p: Project) {
    const pct = progress(p);
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
            <span className={`pj-badge status ${statusClass(p.status)}`}>{p.statusLabel.toUpperCase()}</span>
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
            {formatHours(p.hoursSpent)} / {p.hoursBudget > 0 ? formatHours(p.hoursBudget) : "—"}
          </strong>
          <div className="pj-bar">
            <div style={{ width: `${timePercent(p)}%` }} />
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
          {p.tasks.length === 0 && (
            <div className="pj-task-chip empty">{p.tasksError ? "Couldn't load subtasks" : "No subtasks"}</div>
          )}
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
                  <span className="pj-muted">
                    {progress(p)}% · due {formatDate(p.targetDate)}
                  </span>
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
    if (mineOnly && !userName) {
      return <div className="pj-empty">Couldn't identify the logged-in user from /api/auth/session.</div>;
    }
    const start = new Date(calMonth);
    start.setDate(1 - calMonth.getDay());
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    const tasks = mineOnly ? myTasks : allTasks;
    const todayKey = toDateKey(new Date());
    return (
      <div className="pj-cal">
        <div className="pj-cal-toolbar">
          <button
            aria-label="Previous month"
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <strong>{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
          <button
            aria-label="Next month"
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
          >
            ›
          </button>
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
                    key={`${t.project.id}-${t.id}`}
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
    const items = searched.filter((p) => p.startDate && p.targetDate);
    if (items.length === 0) return <div className="pj-empty">No projects with start and target dates.</div>;
    const min = Math.min(...items.map((p) => parseDate(p.startDate).getTime()));
    const max = Math.max(...items.map((p) => parseDate(p.targetDate).getTime()));
    const span = Math.max(max - min, 86_400_000);
    const pos = (t: number) => ((t - min) / span) * 100;
    const todayPos = pos(parseDate(toDateKey(new Date())).getTime());
    const months: Date[] = [];
    for (
      let m = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
      m.getTime() <= max;
      m.setMonth(m.getMonth() + 1)
    ) {
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
    if (mode === "mine" && !userName) {
      return <div className="pj-empty">Couldn't identify the logged-in user from /api/auth/session.</div>;
    }
    const tasks = (mode === "mine" ? myTasks : overdueTasks).sort((a, b) =>
      (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
    );
    if (tasks.length === 0) {
      return <div className="pj-empty">{mode === "mine" ? "No subtasks assigned to you." : "Nothing is overdue. 🎉"}</div>;
    }
    return (
      <div className="pj-table">
        <div className="pj-table-row head">
          <span>Status</span>
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Due</span>
        </div>
        {tasks.map((t) => (
          <div key={`${t.project.id}-${t.id}`} className={`pj-table-row ${t.done ? "done" : ""}`}>
            <span className={`pj-state ${t.done ? "done" : ""}`}>{t.done ? "Done" : "Open"}</span>
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

  function renderContent() {
    if (loading) {
      return (
        <div className="pj-empty">
          <span className="pj-spinner" /> Loading projects from the backend…
        </div>
      );
    }
    if (error) {
      return (
        <div className="pj-empty pj-error-box">
          <strong>Couldn't load projects</strong>
          <p>{error}</p>
          <button className="pj-btn primary" onClick={load}>
            Try again
          </button>
        </div>
      );
    }
    if (projects.length === 0) return <div className="pj-empty">The backend returned no projects.</div>;

    switch (activeView) {
      case "active":
        return pageItems.length === 0 ? (
          <div className="pj-empty">No active projects match your search.</div>
        ) : (
          <div className="pj-list">{pageItems.map(renderCard)}</div>
        );
      case "board":
        return renderBoard();
      case "task-calendar":
        return renderTaskCalendar(false);
      case "my-calendar":
        return renderTaskCalendar(true);
      case "gantt":
        return renderGantt();
      case "my-tasks":
        return renderTaskTable("mine");
      case "overdue":
        return renderTaskTable("overdue");
    }
  }

  const viewTitles: Record<View, [string, string]> = {
    active: ["Projects", "Manage and track your active projects"],
    board: ["Project Board", "Projects grouped by status"],
    "task-calendar": ["Task Calendar", "Every subtask by due date"],
    gantt: ["Project Gantt View", "Project timelines at a glance"],
    "my-tasks": ["My Tasks", userName ? `Subtasks assigned to ${userName}` : "Subtasks assigned to you"],
    "my-calendar": ["My Calendar", "Your subtasks by due date"],
    overdue: ["Overdue Tasks", "Open subtasks past their due date"],
  };
  const [title, subtitle] = viewTitles[activeView];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#fff7f3] overflow-hidden">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Projects</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="projects-page flex-1 min-h-0">
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

        <h3>My Projects</h3>
        {MY_PROJECTS.map((item) => (
          <button
            key={item.id}
            className={`pj-nav ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="pj-nav-icon">{item.icon}</span>
            {item.label}
            {item.id === "overdue" && overdueTasks.length > 0 && (
              <span className="pj-nav-count">{overdueTasks.length}</span>
            )}
          </button>
        ))}

        <button className="pj-create-list" disabled title={NO_API}>
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
            {activeView === "active" && !loading && !error && (
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
            <button className="pj-new" disabled title={NO_API}>
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
                      ["id", "Project ID"],
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
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      load();
                    }}
                  >
                    ↻ Refresh from backend
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>

      {/* PROJECT DETAILS (read-only until update APIs exist) */}
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
              <div>
                <span>Status</span>
                <strong>{detail.statusLabel}</strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>{detail.priority}</strong>
              </div>
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
                  Time spent <strong>{formatHours(detail.hoursSpent)}</strong>
                  {detail.hoursBudget > 0 && <> of {formatHours(detail.hoursBudget)}</>}
                </span>
                <button className="pj-btn" disabled title={NO_API}>
                  Log hours
                </button>
              </div>
              <div className="pj-bar">
                <div style={{ width: `${timePercent(detail)}%` }} />
              </div>
            </div>

            <h3 className="pj-section-title">
              Subtasks <span className="pj-muted">{progress(detail)}% complete</span>
            </h3>
            {detail.tasksError && <p className="pj-error">Couldn't load subtasks: {detail.tasksError}</p>}
            <div className="pj-checklist">
              {detail.tasks.map((t) => (
                <div key={t.id} className={`pj-check-row ${t.done ? "done" : ""}`}>
                  <span className={`pj-state ${t.done ? "done" : ""}`}>{t.done ? "Done" : "Open"}</span>
                  <span className="pj-check-title">
                    <strong>#{t.id}</strong> {t.title}
                  </span>
                  <span className="pj-muted">{t.assignee}</span>
                  <span className={isOverdue(t) ? "pj-overdue" : "pj-muted"}>{formatDate(t.dueDate)}</span>
                </div>
              ))}
              {detail.tasks.length === 0 && !detail.tasksError && (
                <div className="pj-check-row">
                  <span className="pj-muted">No subtasks</span>
                </div>
              )}
            </div>

            <p className="pj-readonly-note">
              Editing status, subtasks and hours will be enabled once the backend provides the update APIs.
            </p>

            <div className="pj-modal-actions">
              <button className="pj-btn primary" onClick={() => setDetailId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
