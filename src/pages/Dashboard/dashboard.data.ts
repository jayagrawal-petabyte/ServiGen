export type DashboardPriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Unassigned";

export type SlaIncident = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: DashboardPriority;
  slaTime?: string;
};

export type TeamIncident = {
  label: string;
  value: number;
};

export type CategoryItem = {
  label: string;
  value: number;
  displayValue: boolean;
};

export type DashboardTicketNote = {
  id: string;
  author: string;
  time: string;
  text: string;
};

export type DashboardTicket = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: DashboardPriority;
  status?: string;
  description?: string;
  requester?: string;
  department?: string;
  category?: string;
  createdAt?: string;
  targetSla?: string;
  notes?: DashboardTicketNote[];
};