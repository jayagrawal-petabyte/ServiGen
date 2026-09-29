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
  type: string;
  summary: string;
  agent: string;
  priority: Priority;
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

export const PRIORITY_DATA: ChartItem[] = [
  { label: "Critical", value: 68 },
  { label: "High", value: 32 },
  { label: "Medium", value: 26 },
  { label: "Low", value: 21 },
  { label: "Unassigned", value: 14 },
];

export const CATEGORY_DATA: CategoryItem[] = [
  {
    label: "Network>VPN>Connection Failure",
    value: 28,
    showValue: true,
  },
  {
    label: "Business Applications>CRM",
    value: 6,
    showValue: false,
  },
  {
    label: "Hardware>Desktop>Boot Failure",
    value: 11,
    showValue: true,
  },
  {
    label: "Office Applications>Microsoft Teams>Audio/Video Quality",
    value: 11,
    showValue: true,
  },
  {
    label: "Outlook>Email Sending/Receiving",
    value: 11,
    showValue: true,
  },
  {
    label: "Monitor>Display Issues",
    value: 9,
    showValue: true,
  },
  {
    label: "Wi-Fi>Connectivity",
    value: 8,
    showValue: true,
  },
  {
    label: "OneDrive>Sync Issues",
    value: 8,
    showValue: true,
  },
  {
    label: "Security>Phishing>Email Report",
    value: 8,
    showValue: true,
  },
  {
    label: "Security>Multi-Factor Authentication>Token Lost",
    value: 7,
    showValue: true,
  },
];

export const RECENT_INCIDENTS: RecentIncident[] = [
  {
    id: "0003983",
    subject: "External keyboard and mouse stopped working",
    priority: "Medium",
    status: "Open",
    date: "17 Sep 2026",
    description:
      "External keyboard and mouse are not responding on the user's workstation.",
    assignedTo: "Unassigned",
    organisation: "Demo Organisation",
  },
  {
    id: "0003982",
    subject: "Monthly reporting query has been delayed",
    priority: "High",
    status: "In Progress",
    date: "17 Sep 2026",
    description:
      "Monthly reporting query is taking longer than expected to complete.",
    assignedTo: "Unassigned",
    organisation: "Demo Organisation",
  },
  {
    id: "0003981",
    subject: "Need adding to the shared calendar",
    priority: "Low",
    status: "Open",
    date: "16 Sep 2026",
    description:
      "User requires access to the shared team calendar.",
    assignedTo: "Unassigned",
    organisation: "Demo Organisation",
  },
  {
    id: "0003980",
    subject: "Toner is running low on the printer",
    priority: "Low",
    status: "Open",
    date: "16 Sep 2026",
    description:
      "The printer toner is running low and needs replacement.",
    assignedTo: "Unassigned",
    organisation: "Demo Organisation",
  },
  {
    id: "0003979",
    subject: "Can't see my direct reports' timesheets",
    priority: "Medium",
    status: "In Progress",
    date: "16 Sep 2026",
    description:
      "The user cannot access timesheet information for direct reports.",
    assignedTo: "Unassigned",
    organisation: "Demo Organisation",
  },
];

export const NEW_TICKETS: NewTicket[] = [
  {
    id: "0003132-C",
    type: "Project Task",
    summary: "Deployment and Implementation...",
    agent: "Demo User",
    priority: "Low",
  },
  {
    id: "0003013",
    type: "Service Request",
    summary: "Update email display name",
    agent: "Demo User",
    priority: "Medium",
  },
  {
    id: "0003012",
    type: "Service Request",
    summary: "Request external monitor",
    agent: "Demo User",
    priority: "High",
  },
  {
    id: "0003011",
    type: "Service Request",
    summary: "Install Adobe Acrobat Pro",
    agent: "Demo User",
    priority: "Low",
  },
  {
    id: "0003010",
    type: "Service Request",
    summary: "Access request for shared folder",
    agent: "Demo User",
    priority: "Medium",
  },
  {
    id: "0003009",
    type: "Service Request",
    summary: "Request new laptop for new sta...",
    agent: "Demo User",
    priority: "High",
  },
  {
    id: "0002673-P",
    type: "Major Incident",
    summary: "System Login Failure",
    agent: "Demo User",
    priority: "Critical",
  },
  {
    id: "0002237",
    type: "Service Request",
    summary: "Request Addition of New Printer ...",
    agent: "Demo User",
    priority: "Low",
  },
  {
    id: "0002236",
    type: "Service Request",
    summary: "Request Printer Maintenance Se...",
    agent: "Demo User",
    priority: "Low",
  },
];

export const DASHBOARD_STATS = [
  {
    label: "Open Incidents",
    value: "61",
    description: "Currently open",
    variant: "open",
  },
  {
    label: "Resolved Incidents",
    value: "0",
    description: "Resolved incidents",
    variant: "resolved",
  },
  {
    label: "Major Incidents",
    value: "3",
    description: "Major incidents",
    variant: "major",
  },
  {
    label: "Unassigned Incidents",
    value: "16",
    description: "Awaiting assignment",
    variant: "unassigned",
  },
  {
    label: "Average Response Time",
    value: "2.4 hrs",
    description: "Average response",
    variant: "response",
  },
  {
    label: "Average Resolution Time",
    value: "9.56 hrs",
    description: "Average resolution",
    variant: "resolution",
  },
] as const;