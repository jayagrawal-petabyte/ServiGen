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
  { id: "phone-call", label: "Phone Call", color: "#6d28d9" },
  { id: "meeting", label: "Meeting", color: "#d9694f" },
  { id: "site-visit", label: "Site Visit", color: "#2f855a" },
  { id: "resource-booking", label: "Office Resource Booking", color: "#263a5e" },
  { id: "change-request", label: "Change Request", color: "#d97706" },
  { id: "maintenance", label: "Maintenance Window", color: "#dc2626" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}