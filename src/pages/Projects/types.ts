export type ProjectStatus = "New" | "Active" | "On Hold" | "Completed";
export type ProjectPriority = "High" | "Medium" | "Low";

export const PROJECT_STATUSES: ProjectStatus[] = ["New", "Active", "On Hold", "Completed"];

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  statusLabel: string;
  priority: ProjectPriority;
  startDate: string;
  targetDate: string;
  hoursSpent: number;
  hoursBudget: number;
  completionPercent?: number;
  tasks: ProjectTask[];
  tasksError?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
