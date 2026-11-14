export type EventType = "phone-call" | "meeting" | "site-visit" | "resource-booking" | "change-request" | "maintenance";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  type: EventType;
  agent: string;
  allDay?: boolean;
  description?: string;
}

export const APPOINTMENT_TYPES: { id: EventType; label: string; color: string }[] = [
  { id: "phone-call", label: "Phone Call", color: "#7c3aed" },
  { id: "meeting", label: "Meeting", color: "#e85d3a" },
  { id: "site-visit", label: "Site Visit", color: "#16a34a" },
  { id: "resource-booking", label: "Office Resource Booking", color: "#2563eb" },
  { id: "change-request", label: "Change Request", color: "#ea8c00" },
  { id: "maintenance", label: "Maintenance Window", color: "#ef4444" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}