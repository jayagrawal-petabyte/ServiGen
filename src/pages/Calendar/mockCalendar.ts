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

function dateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "1", title: "Team Standup", date: dateStr(0), start: "09:00", end: "09:30", type: "meeting", agent: "Demo User", description: "Daily team sync meeting" },
  { id: "2", title: "Vendor Call – Licences", date: dateStr(0), start: "11:00", end: "12:00", type: "phone-call", agent: "Kaleem Smith", description: "Renewal of software licences" },
  { id: "3", title: "Server Room Booking", date: dateStr(0), start: "14:00", end: "16:00", type: "resource-booking", agent: "Olivia Chen", description: "Rack space for decommission work" },
  { id: "4", title: "Onsite Network Survey", date: dateStr(1), start: "10:00", end: "12:30", type: "site-visit", agent: "Kaleem Smith", description: "Network Connectivity project – site audit" },
  { id: "5", title: "Client Call", date: dateStr(1), start: "15:00", end: "15:45", type: "phone-call", agent: "Demo User", description: "Review project progress with client" },
  { id: "6", title: "Sprint Planning", date: dateStr(2), start: "10:00", end: "11:30", type: "meeting", agent: "Anjali Prasad", description: "Plan next sprint tasks" },
  { id: "7", title: "Meeting Room A", date: dateStr(2), start: "13:00", end: "14:00", type: "resource-booking", agent: "Demo User" },
  { id: "8", title: "Halo Pilot Training", date: dateStr(3), start: "09:30", end: "12:00", type: "meeting", agent: "Kaleem Smith", description: "User training and pilot testing" },
  { id: "9", title: "Data Centre Visit", date: dateStr(3), start: "14:00", end: "17:00", type: "site-visit", agent: "Olivia Chen", description: "Unplug server and wipe data" },
  { id: "10", title: "Design Review", date: dateStr(-1), start: "15:00", end: "16:00", type: "meeting", agent: "Anjali Prasad", description: "Review new UI mockups" },
  { id: "11", title: "Support Callback", date: dateStr(-1), start: "09:00", end: "09:30", type: "phone-call", agent: "Demo User" },
  { id: "12", title: "Projector Booking", date: dateStr(-2), start: "11:00", end: "12:00", type: "resource-booking", agent: "Kaleem Smith" },
  { id: "13", title: "Change Advisory Board", date: dateStr(4), start: "16:00", end: "17:00", type: "meeting", agent: "Olivia Chen" },
  { id: "14", title: "Company Offsite", date: dateStr(5), start: "00:00", end: "23:59", type: "site-visit", agent: "Demo User", allDay: true },
  { id: "15", title: "Hardware Pickup", date: dateStr(7), start: "10:00", end: "11:00", type: "site-visit", agent: "Anjali Prasad" },
  { id: "16", title: "Quarterly Review", date: dateStr(9), start: "13:00", end: "14:30", type: "meeting", agent: "Demo User" },
];
