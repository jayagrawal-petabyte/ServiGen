export type ProjectStatus = "New" | "Active" | "On Hold" | "Completed";
export type ProjectPriority = "High" | "Medium" | "Low";

export const PROJECT_STATUSES: ProjectStatus[] = ["New", "Active", "On Hold", "Completed"];

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD, or "" when the backend sends none
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus; // normalised, used for grouping
  statusLabel: string; // exactly what the backend sent, used for display
  priority: ProjectPriority;
  startDate: string; // YYYY-MM-DD or ""
  targetDate: string; // YYYY-MM-DD or ""
  hoursSpent: number;
  hoursBudget: number; // 0 when unknown
  completionPercent?: number; // only when the backend sends it
  tasks: ProjectTask[];
  tasksError?: string; // set when GET /projects/:id/subtasks failed
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
