/**
 * Servigen Projects Service Layer
 * Corresponds to Servigen API Specification Section 5.7 (Projects Module)
 *
 * Backend Routes:
 * - GET /projects                       : Retrieve all projects
 * - GET /projects/active                : Retrieve active projects
 * - GET /projects/:projectId/subtasks   : Retrieve subtasks for a specific project
 *
 * The API doc does not define create / update / delete endpoints for projects
 * or subtasks yet, so this service is read-only until those are provided.
 */

import { ApiError, api } from "../../services/apiClient";
import {
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  toDateKey,
} from "./types";

// API doc 5.7 lists the routes without an /api prefix. If the backend mounts
// them under /api, change this one line to "/api/projects".
const PROJECTS_PATH = "/projects";

/* ---------- normalisers (backend response schema is not documented yet) ---------- */

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return text(v.name ?? v.fullName ?? v.displayName ?? v.email ?? "");
  }
  return "";
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : toDateKey(d);
}

function mapStatus(raw: string): ProjectStatus {
  const s = raw.toLowerCase().replace(/[_-]/g, " ").trim();
  if (["completed", "complete", "done", "closed", "resolved"].includes(s)) return "Completed";
  if (["on hold", "onhold", "hold", "paused", "blocked"].includes(s)) return "On Hold";
  if (["new", "open", "not started", "planned", "draft"].includes(s)) return "New";
  return "Active";
}

function mapPriority(raw: string): ProjectPriority {
  const p = raw.toLowerCase();
  if (p.startsWith("h") || p === "p1" || p === "critical") return "High";
  if (p.startsWith("l") || p === "p3" || p === "p4") return "Low";
  return "Medium";
}

function list(res: unknown): any[] {
  // apiClient already unwraps { success, data }; also accept a bare array or { items }.
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    for (const key of ["data", "projects", "subtasks", "items", "results"]) {
      if (Array.isArray(r[key])) return r[key] as any[];
    }
  }
  if (typeof res === "string") {
    // An HTML page here means the request hit the frontend dev server, not the backend.
    throw new ApiError(
      `Unexpected non-JSON response from ${PROJECTS_PATH}. Check the backend path / VITE_API_BASE_URL.`,
      0
    );
  }
  return [];
}

export function normalizeSubtask(raw: any): ProjectTask {
  const status = text(raw?.status).toLowerCase();
  return {
    id: text(raw?.id ?? raw?._id ?? raw?.subtaskId),
    title: text(raw?.title ?? raw?.name ?? raw?.summary) || "Untitled task",
    assignee: text(raw?.assignee ?? raw?.assignedTo ?? raw?.owner ?? raw?.agent) || "Unassigned",
    dueDate: dateKey(raw?.dueDate ?? raw?.due_date ?? raw?.deadline ?? raw?.endDate),
    done: Boolean(
      raw?.completed ?? raw?.done ?? raw?.isCompleted ?? ["completed", "done", "closed"].includes(status)
    ),
  };
}

export function normalizeProject(raw: any): Project {
  const statusLabel = text(raw?.status) || "Active";
  const embedded = raw?.subtasks ?? raw?.tasks;
  const percent = raw?.completionPercent ?? raw?.progress ?? raw?.percentComplete;
  return {
    id: text(raw?.id ?? raw?._id ?? raw?.projectId),
    name: text(raw?.name ?? raw?.title ?? raw?.projectName) || "Untitled project",
    description: text(raw?.description ?? raw?.summary),
    owner: text(raw?.owner ?? raw?.ownerName ?? raw?.manager ?? raw?.projectManager ?? raw?.agent) || "Unassigned",
    status: mapStatus(statusLabel),
    statusLabel,
    priority: mapPriority(text(raw?.priority)),
    startDate: dateKey(raw?.startDate ?? raw?.start_date ?? raw?.start),
    targetDate: dateKey(raw?.targetDate ?? raw?.target_date ?? raw?.endDate ?? raw?.dueDate),
    hoursSpent: num(raw?.hoursSpent ?? raw?.timeSpentHours ?? raw?.timeSpent ?? raw?.actualHours),
    hoursBudget: num(raw?.hoursBudget ?? raw?.targetHours ?? raw?.estimatedHours ?? raw?.budgetHours),
    completionPercent: percent === undefined || percent === null ? undefined : num(percent),
    tasks: Array.isArray(embedded) ? embedded.map(normalizeSubtask) : [],
  };
}

/* ---------- endpoints ---------- */

/**
 * Fetch all projects
 * Endpoint: GET /projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const res = await api.get(PROJECTS_PATH);
  return list(res).map(normalizeProject);
}

/**
 * Fetch active projects
 * Endpoint: GET /projects/active
 */
export async function getActiveProjects(): Promise<Project[]> {
  const res = await api.get(`${PROJECTS_PATH}/active`);
  return list(res).map(normalizeProject);
}

/**
 * Fetch subtasks for one project
 * Endpoint: GET /projects/:projectId/subtasks
 */
export async function getProjectSubtasks(projectId: string): Promise<ProjectTask[]> {
  if (!projectId) throw new Error("Validation Error: Project ID is required.");
  const res = await api.get(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}/subtasks`);
  return list(res).map(normalizeSubtask);
}

/**
 * Load everything the Projects screen needs: all projects, which of them are
 * active, and each project's subtasks. Subtasks are only requested for
 * projects whose list response did not already include them.
 */
export async function loadProjectsScreen(): Promise<{ projects: Project[]; activeIds: string[] }> {
  const [all, active] = await Promise.all([getAllProjects(), getActiveProjects()]);

  const projects = await Promise.all(
    all.map(async (p) => {
      if (p.tasks.length > 0 || !p.id) return p;
      try {
        return { ...p, tasks: await getProjectSubtasks(p.id) };
      } catch (err) {
        return { ...p, tasksError: err instanceof Error ? err.message : "Failed to load subtasks" };
      }
    })
  );

  return { projects, activeIds: active.map((p) => p.id) };
}

/**
 * Logged-in user's display name, used for "My Tasks" / "My Calendar".
 * Endpoint: GET /api/auth/session (API doc 5.1)
 */
export async function getSessionUserName(): Promise<string> {
  try {
    const res: any = await api.get("/api/auth/session");
    const user = res?.user ?? res;
    return text(user?.name ?? user?.fullName ?? user?.displayName ?? user?.email);
  } catch {
    return "";
  }
}
