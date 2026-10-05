export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "task" | "appointment" | "meeting" | "reminder";
  description?: string;
}

const today = new Date();
function dateStr(offset: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "1", title: "Team Standup", date: dateStr(0), time: "09:00 AM", type: "meeting", description: "Daily team sync meeting" },
  { id: "2", title: "Fix Login Bug", date: dateStr(0), time: "11:00 AM", type: "task", description: "Resolve auth token expiry issue" },
  { id: "3", title: "Doctor Appointment", date: dateStr(1), time: "10:30 AM", type: "appointment", description: "Annual health checkup" },
  { id: "4", title: "Deploy V0", date: dateStr(1), time: "03:00 PM", type: "task", description: "Push final build to staging" },
  { id: "5", title: "Client Call", date: dateStr(2), time: "02:00 PM", type: "meeting", description: "Review project progress with client" },
  { id: "6", title: "Submit Report", date: dateStr(2), time: "05:00 PM", type: "reminder", description: "Send weekly status report" },
  { id: "7", title: "Code Review", date: dateStr(3), time: "11:00 AM", type: "task", description: "Review PR from team members" },
  { id: "8", title: "Lunch with Team", date: dateStr(3), time: "01:00 PM", type: "appointment" },
  { id: "9", title: "Sprint Planning", date: dateStr(4), time: "10:00 AM", type: "meeting", description: "Plan next sprint tasks" },
  { id: "10", title: "Update Docs", date: dateStr(5), time: "04:00 PM", type: "task", description: "Update API documentation" },
  { id: "11", title: "Pay Bills", date: dateStr(-1), time: "09:00 AM", type: "reminder" },
  { id: "12", title: "Design Review", date: dateStr(-1), time: "03:00 PM", type: "meeting", description: "Review new UI mockups" },
];