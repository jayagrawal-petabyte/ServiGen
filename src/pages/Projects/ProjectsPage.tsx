import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FolderKanban,
  LayoutGrid,
  Calendar,
  BarChart3,
  CheckSquare,
  CalendarCheck,
  Clock,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { type Project, type ProjectPriority, type ProjectStatus, type ProjectTask, PROJECT_STATUSES, toDateKey } from "./types";
import {
  getSessionUserName,
  loadProjectsScreen,
  createProject,
  updateProject,
  createSubtask,
  updateSubtask,
} from "./projectsApi";
import { api } from "../../services/apiClient";
import { MOCK_USERS } from "../../services/fallback/mockData";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import { RefreshButton } from "../../components/shared/RefreshButton";
import "./projects.css";

type View = "active" | "board" | "task-calendar" | "gantt" | "my-tasks" | "my-calendar" | "overdue";
type SortKey = "id" | "name" | "target" | "progress";

const PAGE_SIZE = 3;

const NO_API = "Waiting for backend API (not in the API doc yet)";

interface SidebarNavItem {
  id: View;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string; style?: React.CSSProperties }>;
}

const MY_LISTS: SidebarNavItem[] = [
  { id: "active", label: "Active Projects", Icon: FolderKanban },
  { id: "board", label: "Project Board", Icon: LayoutGrid },
  { id: "task-calendar", label: "Task Calendar", Icon: Calendar },
  { id: "gantt", label: "Project Gantt View", Icon: BarChart3 },
];

const MY_PROJECTS: SidebarNavItem[] = [
  { id: "my-tasks", label: "My Tasks", Icon: CheckSquare },
  { id: "my-calendar", label: "My Calendar", Icon: CalendarCheck },
  { id: "overdue", label: "Overdue Tasks", Icon: Clock },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const TASK_BOARD_COLUMNS = [
  { key: "todo", label: "To Do", dbStatus: "PENDING" },
  { key: "in_progress", label: "In Progress", dbStatus: "IN_PROGRESS" },
  { key: "completed", label: "Completed", dbStatus: "COMPLETED" },
];

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

function getTaskCol(t: ProjectTask): string {
  if (t.done) return "completed";
  const st = ((t as any).status || "").toLowerCase();
  if (st === "in_progress" || st === "in-progress") return "in_progress";
  return "todo";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPriority, setNewPriority] = useState<ProjectPriority>("Medium");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("New");
  const [newStart, setNewStart] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newError, setNewError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editStatus, setEditStatus] = useState<ProjectStatus>("Active");
  const [editStart, setEditStart] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  const [showLogHours, setShowLogHours] = useState(false);
  const [logHoursInput, setLogHoursInput] = useState("");
  const [logSaving, setLogSaving] = useState(false);

  const [boardMode, setBoardMode] = useState<"projects" | "tasks">("projects");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const [expandedGantt, setExpandedGantt] = useState<Record<string, boolean>>({});

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Global safety listener to ensure draggingId and dragOverCol never get stuck under any condition
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggingId(null);
      setDragOverCol(null);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    };

    const handlePointerMove = (e: MouseEvent) => {
      // If mouse is moving without any button pressed, we are definitely NOT dragging
      if (e.buttons === 0) {
        setDraggingId(null);
        setDragOverCol(null);
        isDraggingRef.current = false;
      }
    };

    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);
    window.addEventListener("mouseup", handleGlobalDragEnd);
    window.addEventListener("pointerup", handleGlobalDragEnd);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("blur", handleGlobalDragEnd);
    document.addEventListener("visibilitychange", handleGlobalDragEnd);

    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
      window.removeEventListener("mouseup", handleGlobalDragEnd);
      window.removeEventListener("pointerup", handleGlobalDragEnd);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("blur", handleGlobalDragEnd);
      document.removeEventListener("visibilitychange", handleGlobalDragEnd);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  // Fetch real user list for assignee dropdowns
  useEffect(() => {
    api
      .get("/api/users")
      .then((res: any) => {
        const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (rawList.length > 0) {
          const mapped = rawList.map((u: any) => ({
            id: u.id,
            name: u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username,
            email: u.email,
          }));
          setUsers(mapped);
        } else {
          setUsers(MOCK_USERS.map((u) => ({ id: u.id, name: u.fullName, email: u.email })));
        }
      })
      .catch(() => {
        setUsers(MOCK_USERS.map((u) => ({ id: u.id, name: u.fullName, email: u.email })));
      });
  }, []);

  function openNewModal() {
    setNewName("");
    setNewDesc("");
    setNewOwner(userName || (users[0]?.name ?? ""));
    setNewPriority("Medium");
    setNewStatus("New");
    setNewStart(toDateKey(new Date()));
    setNewTarget("");
    setNewBudget("");
    setNewError("");
    setSaving(false);
    setShowNewModal(true);
  }

  async function saveNewProject() {
    if (!newName.trim()) {
      setNewError("Project name is required.");
      return;
    }
    setSaving(true);
    setNewError("");
    try {
      const created = await createProject({
        name: newName.trim(),
        description: newDesc.trim(),
        owner: newOwner.trim() || userName || "Unassigned",
        priority: newPriority,
        status: newStatus,
        startDate: newStart,
        targetDate: newTarget,
        hoursBudget: newBudget ? parseFloat(newBudget) : undefined,
      });
      setProjects((prev) => [created, ...prev]);
      setActiveIds((prev) => [created.id, ...prev]);
      setShowNewModal(false);
      showToast(`Created project #${created.id} successfully!`);
    } catch (err) {
      setNewError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  function replaceProject(id: string, updated: Project) {
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  function replaceTaskInProject(projectId: string, taskId: string, updated: ProjectTask) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? updated : t)) }
          : p
      )
    );
  }

  function addTaskToProject(projectId: string, task: ProjectTask) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
      )
    );
  }

  async function handleUpdateProject(p: Project) {
    setEditSaving(true);
    setEditError("");
    try {
      const budgetNum = editBudget ? parseFloat(editBudget) : undefined;
      const updated = await updateProject(p.id, {
        status: editStatus,
        startDate: editStart,
        targetDate: editTarget,
        hoursBudget: budgetNum,
      });
      replaceProject(p.id, {
        ...p,
        ...updated,
        hoursBudget: budgetNum !== undefined ? budgetNum : p.hoursBudget,
        tasks: p.tasks,
      });
      showToast(`Saved changes for project #${p.id}`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleTask(projectId: string, task: ProjectTask) {
    setTogglingTaskId(task.id);
    const nextDone = !task.done;
    const nextStatus = nextDone ? "COMPLETED" : "PENDING";
    // Optimistic UI update
    replaceTaskInProject(projectId, task.id, { ...task, done: nextDone, status: nextStatus } as any);
    try {
      const updated = await updateSubtask(projectId, task.id, { done: nextDone, status: nextStatus });
      replaceTaskInProject(projectId, task.id, updated);
      showToast(`Task #${task.id} marked as ${nextDone ? "Done" : "Open"}`);
    } catch {
      // Rollback
      replaceTaskInProject(projectId, task.id, task);
      showToast("Failed to save task status to database.");
    } finally {
      setTogglingTaskId(null);
    }
  }

  async function handleAddTask(projectId: string) {
    if (!taskTitle.trim()) {
      setTaskError("Task title is required.");
      return;
    }
    setTaskSaving(true);
    setTaskError("");
    try {
      const created = await createSubtask(projectId, {
        title: taskTitle.trim(),
        assignee: taskAssignee.trim() || undefined,
        dueDate: taskDue || undefined,
      });
      addTaskToProject(projectId, created);
      setTaskTitle("");
      setTaskAssignee(users[0]?.name || userName || "");
      setTaskDue("");
      setShowAddTask(false);
      showToast(`Added subtask #${created.id} to project!`);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Failed to add subtask.");
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleLogHours(projectId: string) {
    const hours = parseFloat(logHoursInput);
    if (isNaN(hours) || hours <= 0) {
      showToast("Please enter a valid positive number of hours.");
      return;
    }
    setLogSaving(true);
    try {
      const p = projects.find((proj) => proj.id === projectId);
      if (!p) return;
      const newSpent = (p.hoursSpent || 0) + hours;
      replaceProject(projectId, { ...p, hoursSpent: newSpent });
      await updateProject(projectId, { hoursSpent: newSpent } as any);
      showToast(`Logged ${formatHours(hours)} for project #${projectId}!`);
      setLogHoursInput("");
      setShowLogHours(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save logged hours.");
    } finally {
      setLogSaving(false);
    }
  }

  function openDetail(id: string) {
    const p = projects.find((proj) => proj.id === id);
    if (p) {
      setEditStatus(p.status);
      setEditStart(p.startDate);
      setEditTarget(p.targetDate);
      setEditBudget(p.hoursBudget > 0 ? String(p.hoursBudget) : "");
      setEditError("");
      setEditSaving(false);
      setShowAddTask(false);
      setShowLogHours(false);
      setLogHoursInput("");
      setTaskTitle("");
      setTaskAssignee(users[0]?.name || userName || "");
      setTaskDue("");
      setTaskError("");
    }
    setDetailId(id);
  }

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
  const myTasks = useMemo(() => allTasks.filter((t) => sameName(userName, t.assignee)), [allTasks, userName]);
  const overdueTasks = useMemo(() => allTasks.filter(isOverdue), [allTasks]);

  const pageCount = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const pageItems = useMemo(() => listed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [listed, page]);
  const rangeStart = listed.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(listed.length, (page + 1) * PAGE_SIZE);

  // Executive Tracker Metrics
  const trackerStats = useMemo(() => {
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((acc, p) => acc + (p.hoursBudget || 0), 0);
    const totalSpent = projects.reduce((acc, p) => acc + (p.hoursSpent || 0), 0);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const completedProjects = projects.filter((p) => p.status === "Completed").length;
    const activeProjects = projects.filter((p) => p.status === "Active").length;
    const allTaskCount = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const doneTaskCount = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.done).length, 0);
    const overallProgress =
      allTaskCount > 0
        ? Math.round((doneTaskCount / allTaskCount) * 100)
        : totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    return {
      totalProjects,
      totalBudget,
      totalSpent,
      remainingBudget,
      budgetPct,
      completedProjects,
      activeProjects,
      overallProgress,
    };
  }, [projects]);

  function renderTrackerBanner() {
    return (
      <div className="pj-tracker-banner">
        <div className="pj-tracker-stats">
          <div className="pj-stat-card">
            <span className="pj-stat-label">Project Portfolio</span>
            <div className="pj-stat-val">{trackerStats.totalProjects}</div>
            <span className="pj-stat-sub">
              {trackerStats.activeProjects} Active · {trackerStats.completedProjects} Completed
            </span>
          </div>

          <div className="pj-stat-card">
            <span className="pj-stat-label">Overall Completion</span>
            <div className="pj-stat-val" style={{ color: "#16a34a" }}>
              {trackerStats.overallProgress}%
            </div>
            <span className="pj-stat-sub">Portfolio task progress</span>
          </div>

          <div className="pj-stat-card">
            <span className="pj-stat-label">Budgeted Hours</span>
            <div className="pj-stat-val">{formatHours(trackerStats.totalBudget)}</div>
            <span className="pj-stat-sub">Total allocated cap</span>
          </div>

          <div className="pj-stat-card">
            <span className="pj-stat-label">Hours Spent / Burn</span>
            <div
              className="pj-stat-val"
              style={{
                color:
                  trackerStats.budgetPct > 100
                    ? "#dc2626"
                    : trackerStats.budgetPct > 80
                    ? "#ea580c"
                    : "#1e293b",
              }}
            >
              {formatHours(trackerStats.totalSpent)}
            </div>
            <span className="pj-stat-sub">
              {formatHours(trackerStats.remainingBudget)} remaining ({trackerStats.budgetPct}% used)
            </span>
          </div>
        </div>

        {/* Progress Bar & Budget Burn Bar */}
        <div className="pj-tracker-bar-wrap">
          <div className="pj-tracker-bar-header">
            <span>Portfolio Task Completion</span>
            <span>{trackerStats.overallProgress}%</span>
          </div>
          <div className="pj-tracker-bar-bg">
            <div className="pj-tracker-bar-fill" style={{ width: `${trackerStats.overallProgress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  function renderCard(p: Project) {
    const pct = progress(p);
    const shown = p.tasks.slice(0, 6);
    return (
      <article key={p.id} className="pj-card" onClick={() => openDetail(p.id)}>
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

  // Kanban Board with Drag and Drop supporting both Projects and Tasks
  function renderBoard() {
    return (
      <div>
        {/* Toggle between Projects Board and Tasks Board */}
        <div className="pj-board-toggle">
          <button
            type="button"
            className={boardMode === "projects" ? "active" : ""}
            onClick={() => setBoardMode("projects")}
          >
            Projects Board
          </button>
          <button
            type="button"
            className={boardMode === "tasks" ? "active" : ""}
            onClick={() => setBoardMode("tasks")}
          >
            Tasks Board (Drag & Drop Status)
          </button>
        </div>

        {boardMode === "projects" ? (
          <div className={`pj-board ${draggingId ? "is-dragging" : ""}`}>
            {PROJECT_STATUSES.map((status) => {
              const items = searched.filter((p) => p.status === status);
              const isOver = dragOverCol === status;
              return (
                <div
                  key={status}
                  className={`pj-board-col ${isOver ? "drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverCol !== status) setDragOverCol(status);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverCol === status) setDragOverCol(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    setDraggingId(null);
                    setTimeout(() => { isDraggingRef.current = false; }, 120);

                    const rawData = e.dataTransfer.getData("text/plain");
                    if (!rawData) return;
                    let projId = rawData;
                    try {
                      const parsed = JSON.parse(rawData);
                      if (parsed.type === "project") projId = parsed.id;
                    } catch {}
                    const targetProject = projects.find((p) => p.id === projId);
                    if (!targetProject || targetProject.status === status) return;

                    // Optimistic update
                    const prevStatus = targetProject.status;
                    replaceProject(projId, { ...targetProject, status, statusLabel: status });
                    showToast(`Project #${projId} moved to ${status}`);

                    try {
                      await updateProject(projId, { status });
                    } catch (err) {
                      replaceProject(projId, { ...targetProject, status: prevStatus, statusLabel: prevStatus });
                      showToast(err instanceof Error ? err.message : "Failed to save project status to database.");
                    }
                  }}
                >
                  <div className="pj-board-head">
                    <span className={`pj-badge status ${statusClass(status)}`}>{status.toUpperCase()}</span>
                    <span className="pj-count">{items.length}</span>
                  </div>
                  {items.map((p) => (
                    <div
                      key={p.id}
                      draggable={true}
                      className="pj-board-card"
                      style={{ opacity: 1 }}
                      onDragStart={(e) => {
                        isDraggingRef.current = true;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData(
                          "text/plain",
                          JSON.stringify({ type: "project", id: p.id })
                        );
                        setDraggingId(p.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverCol(null);
                        setTimeout(() => { isDraggingRef.current = false; }, 120);
                      }}
                      onClick={() => {
                        if (isDraggingRef.current) return;
                        openDetail(p.id);
                      }}
                    >
                      <span className="pj-id small">#{p.id}</span>
                      <strong>{p.name}</strong>
                      <span className="pj-muted">👤 {p.owner}</span>
                      <div className="pj-bar thin">
                        <div style={{ width: `${progress(p)}%` }} />
                      </div>
                      <span className="pj-muted">
                        {progress(p)}% · due {formatDate(p.targetDate)}
                      </span>
                    </div>
                  ))}
                  {items.length === 0 && <p className="pj-muted pj-board-empty">Drag project here</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`pj-board ${draggingId ? "is-dragging" : ""}`} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {TASK_BOARD_COLUMNS.map((col) => {
              const colTasks = allTasks.filter((t) => getTaskCol(t) === col.key);
              const isOver = dragOverCol === col.key;
              return (
                <div
                  key={col.key}
                  className={`pj-board-col ${isOver ? "drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverCol !== col.key) setDragOverCol(col.key);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverCol === col.key) setDragOverCol(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    setDraggingId(null);
                    setTimeout(() => { isDraggingRef.current = false; }, 120);

                    const rawData = e.dataTransfer.getData("text/plain");
                    if (!rawData) return;
                    try {
                      const parsed = JSON.parse(rawData);
                      if (parsed.type !== "task") return;
                      const { projectId, taskId } = parsed;
                      const proj = projects.find((p) => p.id === projectId);
                      const task = proj?.tasks.find((t) => t.id === taskId);
                      if (!proj || !task) return;

                      const isDone = col.key === "completed";
                      const prevDone = task.done;
                      const prevStatus = (task as any).status;

                      // Optimistically update
                      replaceTaskInProject(projectId, taskId, {
                        ...task,
                        done: isDone,
                        status: col.dbStatus,
                      } as any);
                      showToast(`Task #${taskId} moved to ${col.label} (saved to DB)`);

                      // Persist to backend database!
                      try {
                        await updateSubtask(projectId, taskId, {
                          done: isDone,
                          status: col.dbStatus,
                        });
                      } catch {
                        // Rollback on failure
                        replaceTaskInProject(projectId, taskId, {
                          ...task,
                          done: prevDone,
                          status: prevStatus,
                        } as any);
                        showToast(`Failed to update status for task #${taskId}`);
                      }
                    } catch {}
                  }}
                >
                  <div className="pj-board-head">
                    <span
                      className="pj-badge"
                      style={{
                        backgroundColor:
                          col.key === "completed"
                            ? "#e7f5e8"
                            : col.key === "in_progress"
                            ? "#e0f2fe"
                            : "#f1f5f9",
                        color:
                          col.key === "completed"
                            ? "#2e7d32"
                            : col.key === "in_progress"
                            ? "#0284c7"
                            : "#475569",
                        fontWeight: 700,
                      }}
                    >
                      {col.label.toUpperCase()}
                    </span>
                    <span className="pj-count">{colTasks.length}</span>
                  </div>
                  {colTasks.map((t) => (
                    <div
                      key={`${t.project.id}-${t.id}`}
                      draggable={true}
                      className="pj-board-card"
                      style={{ opacity: 1 }}
                      onDragStart={(e) => {
                        isDraggingRef.current = true;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData(
                          "text/plain",
                          JSON.stringify({ type: "task", projectId: t.project.id, taskId: t.id })
                        );
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverCol(null);
                        setTimeout(() => { isDraggingRef.current = false; }, 120);
                      }}
                      onClick={() => {
                        if (isDraggingRef.current) return;
                        openDetail(t.project.id);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <span className="pj-id small">#{t.id}</span>
                        <span
                          className="pj-badge"
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            backgroundColor: "#fef3c7",
                            color: "#b45309",
                          }}
                        >
                          {t.project.name}
                        </span>
                      </div>
                      <strong>{t.title}</strong>
                      <span className="pj-muted">👤 {t.assignee || "Unassigned"}</span>
                      {t.dueDate && (
                        <span
                          className={isOverdue(t) ? "pj-overdue" : "pj-muted"}
                          style={{ fontSize: "11px" }}
                        >
                          Due {formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="pj-muted pj-board-empty">Drag task here</p>}
                </div>
              );
            })}
          </div>
        )}
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
                    onClick={() => openDetail(t.project.id)}
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

  // Interactive Gantt Timeline with expandable subtasks
  function renderGantt() {
    // Provide safe fallback dates so all projects are rendered on the Gantt timeline
    const todayKey = toDateKey(new Date());
    const items = searched.map((p) => {
      const startDate = p.startDate || toDateKey(new Date(Date.now() - 14 * 86400000));
      const targetDate = p.targetDate || toDateKey(new Date(Date.now() + 30 * 86400000));
      return { ...p, startDate, targetDate };
    });

    if (items.length === 0) {
      return <div className="pj-empty">No projects found for Gantt view.</div>;
    }

    const min = Math.min(...items.map((p) => parseDate(p.startDate).getTime()));
    const max = Math.max(...items.map((p) => parseDate(p.targetDate).getTime()));
    const span = Math.max(max - min, 86_400_000);
    const pos = (t: number) => Math.max(0, Math.min(100, ((t - min) / span) * 100));
    const todayPos = pos(parseDate(todayKey).getTime());

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
        {/* Gantt Legend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 700, color: "#475569" }}>Timeline Scale:</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#C96F55" }} /> Active
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#16a34a" }} /> Completed
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ffad0d" }} /> On Hold
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} /> Overdue Task
            </span>
          </div>
          <span style={{ color: "#64748b" }}>Click project or subtask row to open details</span>
        </div>

        {/* Timeline Header Row */}
        <div className="pj-gantt-row pj-gantt-scale">
          <div className="pj-gantt-name">Project / Subtasks</div>
          <div className="pj-gantt-track">
            {months.map((m) => (
              <span key={m.toISOString()} style={{ left: `${Math.max(0, pos(m.getTime()))}%` }}>
                {m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </span>
            ))}
          </div>
        </div>

        {/* Project and Subtask Timeline Rows */}
        {items.map((p) => {
          const left = pos(parseDate(p.startDate).getTime());
          const width = Math.max(pos(parseDate(p.targetDate).getTime()) - left, 2.5);
          const isExpanded = Boolean(expandedGantt[p.id]);

          return (
            <div key={p.id}>
              {/* Project Main Row */}
              <div className="pj-gantt-row">
                <div className="pj-gantt-name" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {p.tasks.length > 0 ? (
                    <button
                      type="button"
                      className="pj-gantt-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedGantt((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                      }}
                      title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  ) : (
                    <span style={{ width: 14 }} />
                  )}
                  <button
                    className="pj-link"
                    style={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onClick={() => openDetail(p.id)}
                  >
                    {p.name}
                  </button>
                </div>

                <div className="pj-gantt-track">
                  {todayPos >= 0 && todayPos <= 100 && (
                    <div className="pj-gantt-today" style={{ left: `${todayPos}%` }} title="Today" />
                  )}
                  <button
                    className={`pj-gantt-bar ${statusClass(p.status)}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${p.name} (${formatDate(p.startDate)} → ${formatDate(p.targetDate)}) — ${progress(p)}% complete`}
                    onClick={() => openDetail(p.id)}
                  >
                    <span className="pj-gantt-fill" style={{ width: `${progress(p)}%` }} />
                    <span className="pj-gantt-label">{progress(p)}%</span>
                  </button>
                </div>
              </div>

              {/* Expanded Subtask Rows */}
              {isExpanded &&
                p.tasks.map((t) => {
                  const taskDate = t.dueDate ? parseDate(t.dueDate).getTime() : parseDate(p.startDate).getTime();
                  const taskLeft = pos(taskDate);
                  return (
                    <div key={`${p.id}-${t.id}`} className="pj-gantt-subtask-row">
                      <div className="pj-gantt-subtask-name" title={t.title}>
                        ↳ #{t.id} {t.title}
                      </div>
                      <div className="pj-gantt-track">
                        <div
                          className={`pj-gantt-subtask-bar ${t.done ? "done" : isOverdue(t) ? "overdue" : ""}`}
                          style={{ left: `${taskLeft}%`, width: "24px" }}
                          title={`#${t.id} ${t.title} (${t.assignee || "Unassigned"}) Due: ${formatDate(t.dueDate)} — ${t.done ? "Done" : "Pending"}`}
                          onClick={() => openDetail(p.id)}
                        />
                      </div>
                    </div>
                  );
                })}
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
            <span
              className={`pj-state ${t.done ? "done" : ""}`}
              style={{ cursor: "pointer" }}
              title={t.done ? "Mark as open" : "Mark as done"}
              onClick={() => handleToggleTask(t.project.id, t)}
            >
              {togglingTaskId === t.id ? "..." : t.done ? "Done" : "Open"}
            </span>
            <span>
              <strong>#{t.id}</strong> {t.title}
            </span>
            <button className="pj-link" onClick={() => openDetail(t.project.id)}>
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
    board: ["Project Board", "Projects & Tasks Kanban drag-and-drop board"],
    "task-calendar": ["Task Calendar", "Every subtask by due date"],
    gantt: ["Project Gantt View", "Interactive timeline & milestone view"],
    "my-tasks": ["My Tasks", userName ? `Subtasks assigned to ${userName}` : "Subtasks assigned to you"],
    "my-calendar": ["My Calendar", "Your subtasks by due date"],
    overdue: ["Overdue Tasks", "Open subtasks past their due date"],
  };
  const [title, subtitle] = viewTitles[activeView];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#FFF9F5] overflow-hidden">
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
              placeholder="Search project records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              aria-label={search ? "Clear search" : "Search"}
              onClick={() => (search ? setSearch("") : searchRef.current?.focus())}
            >
              {search ? <X size={15} /> : <Search size={15} />}
            </button>
          </div>

          <h3>My Lists</h3>
          {MY_LISTS.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                className={`pj-nav ${activeView === item.id ? "active" : ""}`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="pj-nav-icon">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                {item.label}
              </button>
            );
          })}

          <h3>My Projects</h3>
          {MY_PROJECTS.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                className={`pj-nav ${activeView === item.id ? "active" : ""}`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="pj-nav-icon">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                {item.label}
                {item.id === "overdue" && overdueTasks.length > 0 && (
                  <span className="pj-nav-count">{overdueTasks.length}</span>
                )}
              </button>
            );
          })}

          <button className="pj-create-list" disabled title={NO_API}>
            <PlusCircle size={15} />
            <span>Create a New list</span>
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
              <RefreshButton
                size="sm"
                onClick={() => load()}
                isLoading={loading}
                title="Refresh projects from backend"
              />
              <button className="pj-new" onClick={openNewModal}>
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
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Progress Bar & Budget Hours Tracker KPI Banner */}
          {!loading && !error && renderTrackerBanner()}

          {renderContent()}
        </main>

        {/* Project Detail Modal */}
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
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    style={{ fontWeight: 600, fontSize: 13, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 4 }}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
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
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="date"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      style={{ fontSize: 12, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 4 }}
                    />
                    <span>&rarr;</span>
                    <input
                      type="date"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      style={{ fontSize: 12, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>

              {/* Hours Budget Field */}
              <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Hours Budget:</span>
                <input
                  type="number"
                  min="0"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  placeholder="e.g. 120"
                  style={{ width: "90px", fontSize: 12, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 4 }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>hours allocated</span>
              </div>

              {(editStatus !== detail.status ||
                editStart !== detail.startDate ||
                editTarget !== detail.targetDate ||
                editBudget !== String(detail.hoursBudget || "")) && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
                  <button
                    className="pj-btn primary"
                    disabled={editSaving}
                    onClick={() => handleUpdateProject(detail)}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="pj-btn"
                    onClick={() => {
                      setEditStatus(detail.status);
                      setEditStart(detail.startDate);
                      setEditTarget(detail.targetDate);
                      setEditBudget(detail.hoursBudget > 0 ? String(detail.hoursBudget) : "");
                      setEditError("");
                    }}
                  >
                    Cancel
                  </button>
                  {editError && <span className="pj-error" style={{ margin: 0 }}>{editError}</span>}
                </div>
              )}

              {/* Hours Spent & Log Hours Section */}
              <div className="pj-detail-hours">
                <div className="pj-detail-hours-top">
                  <span>
                    Time spent <strong>{formatHours(detail.hoursSpent)}</strong>
                    {detail.hoursBudget > 0 && <> of {formatHours(detail.hoursBudget)}</>}
                  </span>
                  <button
                    className="pj-btn"
                    style={{ fontSize: 12, padding: "3px 10px", backgroundColor: "#fff", borderColor: "#C96F55", color: "#C96F55" }}
                    onClick={() => setShowLogHours(!showLogHours)}
                  >
                    {showLogHours ? "Cancel" : "+ Log Hours"}
                  </button>
                </div>
                <div className="pj-bar">
                  <div style={{ width: `${timePercent(detail)}%` }} />
                </div>

                {/* Inline Log Hours Box */}
                {showLogHours && (
                  <div className="pj-log-hours-box">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#C96F55" }}>Log Working Hours</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={logHoursInput}
                        onChange={(e) => setLogHoursInput(e.target.value)}
                        placeholder="Hours (e.g. 2.5)"
                        style={{ width: "120px", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                      />
                      <button
                        className="pj-btn primary"
                        disabled={logSaving || !logHoursInput}
                        onClick={() => handleLogHours(detail.id)}
                        style={{ fontSize: 12, padding: "4px 12px" }}
                      >
                        {logSaving ? "Saving..." : "Save Hours"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks Section with Assignee Dropdown */}
              <h3 className="pj-section-title">
                Subtasks <span className="pj-muted">{progress(detail)}% complete</span>
                <button
                  className="pj-btn"
                  style={{ marginLeft: 12, fontSize: 12, padding: "2px 10px" }}
                  onClick={() => setShowAddTask(!showAddTask)}
                >
                  {showAddTask ? "Cancel" : "+ Add Task"}
                </button>
              </h3>

              {showAddTask && (
                <div className="pj-form" style={{ marginBottom: 12, padding: 12, background: "#faf6f4", borderRadius: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
                    <label>
                      Title *
                      <input
                        autoFocus
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Task title"
                      />
                    </label>
                    <label>
                      Assignee
                      <select
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        className="pj-select"
                      >
                        <option value="">Select Assignee...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} {u.email ? `(${u.email})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Due Date
                      <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                    </label>
                  </div>
                  {taskError && <p className="pj-error">{taskError}</p>}
                  <button
                    className="pj-btn primary"
                    style={{ marginTop: 8 }}
                    disabled={taskSaving}
                    onClick={() => handleAddTask(detail.id)}
                  >
                    {taskSaving ? "Adding..." : "Add Subtask"}
                  </button>
                </div>
              )}

              {detail.tasksError && <p className="pj-error">Couldn't load subtasks: {detail.tasksError}</p>}
              <div className="pj-checklist">
                {detail.tasks.map((t) => (
                  <div key={t.id} className={`pj-check-row ${t.done ? "done" : ""}`}>
                    <span
                      className={`pj-state ${t.done ? "done" : ""}`}
                      style={{ cursor: "pointer" }}
                      title={t.done ? "Mark as open" : "Mark as done"}
                      onClick={() => handleToggleTask(detail.id, t)}
                    >
                      {togglingTaskId === t.id ? "..." : t.done ? "Done" : "Open"}
                    </span>
                    <span className="pj-check-title">
                      <strong>#{t.id}</strong> {t.title}
                    </span>

                    {/* Inline Task Assignee Dropdown */}
                    <select
                      value={t.assignee || ""}
                      onChange={async (e) => {
                        const newAssignee = e.target.value;
                        replaceTaskInProject(detail.id, t.id, { ...t, assignee: newAssignee });
                        try {
                          await updateSubtask(detail.id, t.id, { assignee: newAssignee });
                          showToast(`Task #${t.id} reassigned to ${newAssignee}`);
                        } catch {
                          showToast(`Failed to update assignee for task #${t.id}`);
                        }
                      }}
                      style={{
                        fontSize: 11,
                        padding: "2px 6px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 4,
                        background: "#fff",
                        color: "#475569",
                        maxWidth: "140px",
                      }}
                      title="Change task assignee"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>

                    <span className={isOverdue(t) ? "pj-overdue" : "pj-muted"}>{formatDate(t.dueDate)}</span>
                  </div>
                ))}
                {detail.tasks.length === 0 && !detail.tasksError && (
                  <div className="pj-check-row">
                    <span className="pj-muted">No subtasks yet &mdash; click "+ Add Task" above</span>
                  </div>
                )}
              </div>

              <div className="pj-modal-actions">
                <button className="pj-btn primary" onClick={() => setDetailId(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showNewModal && (
          <div className="pj-overlay" onClick={() => setShowNewModal(false)}>
            <div className="pj-modal wide" onClick={(e) => e.stopPropagation()}>
              <div className="pj-modal-head">
                <div>
                  <h2>New Project</h2>
                  <p className="pj-muted">Create a new project and save it to the database.</p>
                </div>
                <button className="pj-close" aria-label="Close" onClick={() => setShowNewModal(false)}>
                  ✕
                </button>
              </div>

              <div className="pj-form">
                <label>
                  Project Name *
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Server Migration Phase 2"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of the project"
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    Owner
                    <select
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="pj-select"
                    >
                      <option value="">Select Project Owner...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} {u.email ? `(${u.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as ProjectPriority)}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <label>
                    Status
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}>
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start Date
                    <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                  </label>
                  <label>
                    Target Date
                    <input type="date" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
                  </label>
                  <label>
                    Hours Budget
                    <input
                      type="number"
                      min="0"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="e.g. 120"
                    />
                  </label>
                </div>
                {newError && <p className="pj-error">{newError}</p>}
              </div>

              <div className="pj-modal-actions">
                <button className="pj-btn" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button className="pj-btn primary" disabled={saving} onClick={saveNewProject}>
                  {saving ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toast && (
          <div className="approvals-toast info">
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
