export type EventType = "meeting" | "call" | "followup" | "demo" | "support" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  type: EventType;
  agent: string;
  description?: string;
  allDay?: boolean;
}

export const AGENTS = [
  "Demo User",
  "Kaleem Smith",
  "Olivia Chen",
  "Anjali Prasad",
];

export const APPOINTMENT_TYPES: { id: EventType; label: string; color: string }[] = [
  { id: "meeting", label: "Meeting", color: "#eb6a47" },
  { id: "call", label: "Call", color: "#3b82f6" },
  { id: "followup", label: "Follow-up", color: "#10b981" },
  { id: "demo", label: "Demo", color: "#8b5cf6" },
  { id: "support", label: "Support", color: "#f59e0b" },
  { id: "other", label: "Other", color: "#64748b" },
];

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}