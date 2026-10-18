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

export function getDefaultCalendarEvents(): CalendarEvent[] {
  const padNum = (n: number) => String(n).padStart(2, "0");
  const toKey = (d: Date) => `${d.getFullYear()}-${padNum(d.getMonth() + 1)}-${padNum(d.getDate())}`;

  const today = new Date();
  const relDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toKey(d);
  };

  return [
    // Today & current relative days
    { id: "cal-1", title: "Daily Support Standup", date: relDate(0), start: "09:00", end: "09:30", type: "meeting", agent: "Demo User", description: "Daily team standup and ticket triaging" },
    { id: "cal-2", title: "Vendor SLA Review Call", date: relDate(0), start: "11:00", end: "12:00", type: "phone-call", agent: "Kaleem Smith", description: "Vendor SLA contract review" },
    { id: "cal-3", title: "Server Room Rack Upgrade", date: relDate(0), start: "14:00", end: "16:00", type: "resource-booking", agent: "Olivia Chen", description: "Rack space maintenance & cabling" },
    { id: "cal-4", title: "Onsite Network Audit", date: relDate(1), start: "10:00", end: "12:30", type: "site-visit", agent: "Kaleem Smith", description: "Branch office network connectivity audit" },
    { id: "cal-5", title: "Major Incident Post-Mortem", date: relDate(1), start: "15:00", end: "15:45", type: "phone-call", agent: "Demo User", description: "Incident retrospective discussion" },
    { id: "cal-6", title: "Sprint Backlog Review", date: relDate(2), start: "10:00", end: "11:30", type: "meeting", agent: "Anjali Prasad", description: "Review and estimate sprint items" },
    { id: "cal-7", title: "Boardroom A Booking", date: relDate(2), start: "13:00", end: "14:00", type: "resource-booking", agent: "Demo User", description: "Executive client presentation" },
    { id: "cal-8", title: "IT Service Catalog Training", date: relDate(3), start: "09:30", end: "12:00", type: "meeting", agent: "Kaleem Smith", description: "Internal agent training session" },
    { id: "cal-9", title: "Disaster Recovery Site Visit", date: relDate(3), start: "14:00", end: "17:00", type: "site-visit", agent: "Olivia Chen", description: "Offsite backup verification" },
    { id: "cal-10", title: "Architecture Sync", date: relDate(-1), start: "15:00", end: "16:00", type: "meeting", agent: "Anjali Prasad", description: "Review infrastructure changes" },
    { id: "cal-11", title: "Client Callback – VIP Issue", date: relDate(-1), start: "09:00", end: "09:30", type: "phone-call", agent: "Demo User", description: "Follow up on VIP ticket" },
    { id: "cal-12", title: "Lab Station 4 Reservation", date: relDate(-2), start: "11:00", end: "12:00", type: "resource-booking", agent: "Kaleem Smith", description: "Hardware testing lab" },
    { id: "cal-13", title: "Change Advisory Board (CAB)", date: relDate(4), start: "16:00", end: "17:00", type: "meeting", agent: "Olivia Chen", description: "Weekly change approval board" },
    { id: "cal-14", title: "Hardware Dispatch Pickup", date: relDate(5), start: "10:00", end: "11:00", type: "site-visit", agent: "Anjali Prasad", description: "Asset inventory collection" },
    { id: "cal-15", title: "Quarterly Review & Planning", date: relDate(6), start: "13:00", end: "14:30", type: "meeting", agent: "Demo User", description: "Q3 operational performance review" },

    // August 2026 events (matching calendar date navigation in August 2026)
    { id: "cal-aug-1", title: "August Kickoff & Staff Sync", date: "2026-08-01", start: "10:00", end: "11:00", type: "meeting", agent: "Demo User", description: "Monthly roadmap kickoff" },
    { id: "cal-aug-2", title: "Vendor Contract Negotiation", date: "2026-08-03", start: "11:30", end: "12:30", type: "phone-call", agent: "Kaleem Smith", description: "Hardware refresh agreement" },
    { id: "cal-aug-3", title: "Perimeter Firewall Audit", date: "2026-08-05", start: "14:00", end: "16:30", type: "site-visit", agent: "Olivia Chen", description: "Physical firewall appliance inspection" },
    { id: "cal-aug-4", title: "Executive Conference Room", date: "2026-08-07", start: "09:00", end: "11:00", type: "resource-booking", agent: "Demo User", description: "Stakeholder briefing" },
    { id: "cal-aug-5", title: "Cloud Migration Review", date: "2026-08-10", start: "13:00", end: "14:30", type: "meeting", agent: "Anjali Prasad", description: "AWS database cutover review" },
    { id: "cal-aug-6", title: "Critical Patching Callback", date: "2026-08-12", start: "10:00", end: "10:45", type: "phone-call", agent: "Demo User", description: "Customer status update" },
    { id: "cal-aug-7", title: "Datacenter HVAC Maintenance", date: "2026-08-14", start: "08:30", end: "12:00", type: "site-visit", agent: "Kaleem Smith", description: "Cooling system verification" },
    { id: "cal-aug-8", title: "Demo Lab Reservation", date: "2026-08-18", start: "15:00", end: "17:00", type: "resource-booking", agent: "Olivia Chen", description: "Customer POC environment" },
    { id: "cal-aug-9", title: "Service Desk Retrospective", date: "2026-08-21", start: "11:00", end: "12:00", type: "meeting", agent: "Anjali Prasad", description: "Sprint retrospective" },
    { id: "cal-aug-10", title: "Telecom Trunk Line Audit", date: "2026-08-25", start: "14:00", end: "15:30", type: "site-visit", agent: "Demo User", description: "SIP trunk routing verification" },
  ];
}
