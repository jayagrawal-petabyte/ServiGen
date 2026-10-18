export type Priority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Unassigned";

export type IncidentStatus =
  | "In Progress"
  | "Open"
  | "Resolved"
  | "On Hold";

export type RecentIncident = {
  id: string;
  subject: string;
  priority: Priority;
  status: IncidentStatus;
  date: string;
  description: string;
  assignedTo: string;
  organisation: string;
};

export type TicketNote = {
  id: string;
  author: string;
  time: string;
  text: string;
};

export type NewTicket = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: Priority;
  status?: string;
  description?: string;
  requester?: string;
  department?: string;
  category?: string;
  createdAt?: string;
  targetSla?: string;
  notes?: TicketNote[];
};

export type ChartItem = {
  label: string;
  value: number;
};

export type CategoryItem = {
  label: string;
  value: number;
  showValue?: boolean;
};