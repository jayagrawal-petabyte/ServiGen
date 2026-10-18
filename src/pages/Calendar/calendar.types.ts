export type EventType = "phone-call" | "meeting" | "site-visit" | "resource-booking";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, local time
  start: string; // HH:mm, 24h
  end: string; // HH:mm, 24h
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
];

export const AGENTS = ["Demo User", "Kaleem Smith", "Olivia Chen", "Anjali Prasad"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Local date key. toISOString() would shift the day for timezones ahead of UTC.
export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
