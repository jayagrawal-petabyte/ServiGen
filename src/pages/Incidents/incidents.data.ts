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

export type NewTicket = {
  id: string;
  type: "Service Request" | "Incident";
  summary: string;
  category: string;
  priority: Priority;
  status: IncidentStatus;
};

export type ChartItem = {
  label: string;
  value: number;
};

export const PRIORITY_DATA: ChartItem[] = [
  {
    label: "Critical",
    value: 68,
  },
  {
    label: "High",
    value: 32,
  },
  {
    label: "Medium",
    value: 26,
  },
  {
    label: "Low",
    value: 21,
  },
  {
    label: "Unassigned",
    value: 14,
  },
];

export const CATEGORY_DATA: ChartItem[] = [
  {
    label: "Hardware",
    value: 36,
  },
  {
    label: "Software",
    value: 28,
  },
  {
    label: "Network",
    value: 20,
  },
  {
    label: "Access",
    value: 16,
  },
];

export const RECENT_INCIDENTS: RecentIncident[] = [
  {
    id: "INC000451",
    subject: "Network connectivity issue",
    priority: "Critical",
    status: "In Progress",
    date: "12 Sep 2026",
    description:
      "Users are experiencing network connectivity issues across the organisation.",
    assignedTo: "Support Team",
    organisation: "Meridian Foods Ltd",
  },
  {
    id: "INC000450",
    subject: "Email service unavailable",
    priority: "High",
    status: "Open",
    date: "12 Sep 2026",
    description:
      "The organisation email service is currently unavailable for affected users.",
    assignedTo: "Messaging Team",
    organisation: "Northbridge Logistics",
  },
  {
    id: "INC000449",
    subject: "Printer not responding",
    priority: "Medium",
    status: "Resolved",
    date: "11 Sep 2026",
    description:
      "The office printer was not responding to print jobs.",
    assignedTo: "Desktop Support",
    organisation: "Aurelia Health",
  },
  {
    id: "INC000448",
    subject: "VPN connection failure",
    priority: "Low",
    status: "In Progress",
    date: "11 Sep 2026",
    description:
      "The user is unable to establish a VPN connection.",
    assignedTo: "Network Team",
    organisation: "Solace Retail Group",
  },
  {
    id: "INC000447",
    subject: "System performance issue",
    priority: "High",
    status: "On Hold",
    date: "10 Sep 2026",
    description:
      "Users reported slow response times in the internal system.",
    assignedTo: "Application Support",
    organisation: "Meridian Foods Ltd",
  },
];

export const NEW_TICKETS: NewTicket[] = [
  {
    id: "INC001245",
    type: "Service Request",
    summary: "Email access issue",
    category: "Email",
    priority: "High",
    status: "Open",
  },
  {
    id: "INC001244",
    type: "Service Request",
    summary: "New laptop setup",
    category: "Hardware",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: "INC001243",
    type: "Incident",
    summary: "Network connection issue",
    category: "Network",
    priority: "Critical",
    status: "Open",
  },
  {
    id: "INC001242",
    type: "Service Request",
    summary: "Software installation",
    category: "Software",
    priority: "Low",
    status: "Resolved",
  },
  {
    id: "INC001241",
    type: "Service Request",
    summary: "Password reset request",
    category: "Access",
    priority: "Medium",
    status: "Open",
  },
];