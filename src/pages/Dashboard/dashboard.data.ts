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
  slaTime: string;
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

export type DashboardTicket = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: DashboardPriority;
};

export const DASHBOARD_STATS = [
  {
    label: "Open Incidents",
    value: "61",
    type: "open",
  },
  {
    label: "Resolved Incidents",
    value: "0",
    type: "resolved",
  },
  {
    label: "Major Incidents",
    value: "3",
    type: "major",
  },
  {
    label: "Unassigned Incidents",
    value: "16",
    type: "unassigned",
  },
  {
    label: "Average Response Time",
    value: "2.4",
    suffix: "Hrs",
    type: "response",
  },
  {
    label: "Average Resolution Time",
    value: "9.56",
    suffix: "Hrs",
    type: "resolution",
  },
] as const;

export const SLA_INCIDENTS: SlaIncident[] = [
  {
    id: "0003988",
    type: "Service Request",
    summary: "Would like my desk phone extens...",
    agent: "Unassigned",
    priority: "Low",
    slaTime: "-32:01",
  },
  {
    id: "0003987",
    type: "Incident",
    summary: "Desktop shows a blue screen wit...",
    agent: "Unassigned",
    priority: "High",
    slaTime: "-88:01",
  },
  {
    id: "0003986",
    type: "Incident",
    summary: "New phone is stuck on 'applying ...",
    agent: "Unassigned",
    priority: "Medium",
    slaTime: "-64:00",
  },
  {
    id: "0003985",
    type: "Incident",
    summary: "My camera shows as available b...",
    agent: "Unassigned",
    priority: "Medium",
    slaTime: "-40:01",
  },
  {
    id: "0003984",
    type: "Service Request",
    summary: "Requesting read access to the s...",
    agent: "Unassigned",
    priority: "Low",
    slaTime: "-40:01",
  },
  {
    id: "0003983",
    type: "Incident",
    summary: "External keyboard and mouse st...",
    agent: "Unassigned",
    priority: "Medium",
    slaTime: "-88:01",
  },
  {
    id: "0003982",
    type: "Incident",
    summary: "Monthly reporting query has bee...",
    agent: "Unassigned",
    priority: "High",
    slaTime: "-64:00",
  },
  {
    id: "0003981",
    type: "Service Request",
    summary: "Need adding to the shared calen...",
    agent: "Unassigned",
    priority: "Low",
    slaTime: "-40:01",
  },
  {
    id: "0003980",
    type: "Service Request",
    summary: "Toner is running low on the printe...",
    agent: "Unassigned",
    priority: "Low",
    slaTime: "-40:01",
  },
  {
    id: "0003979",
    type: "Incident",
    summary: "Can't see my direct reports' time...",
    agent: "Unassigned",
    priority: "Medium",
    slaTime: "-88:01",
  },
];

export const TEAM_INCIDENTS: TeamIncident[] = [
  {
    label: "1st Line Support",
    value: 89,
  },
  {
    label: "2nd Line Support",
    value: 37,
  },
  {
    label: "Infrastructure",
    value: 36,
  },
  {
    label: "Human Resources",
    value: 21,
  },
  {
    label: "Payroll",
    value: 14,
  },
];

export const CATEGORY_DATA: CategoryItem[] = [
  {
    label: "Security>Multi-Factor Authentication>Token Lost",
    value: 7,
    displayValue: true,
  },
  {
    label: "Security>Phishing>Email Report",
    value: 8,
    displayValue: true,
  },
  {
    label: "OneDrive>Sync Issues",
    value: 8,
    displayValue: true,
  },
  {
    label: "Wi-Fi>Connectivity",
    value: 8,
    displayValue: true,
  },
  {
    label: "Monitor>Display Issues",
    value: 9,
    displayValue: true,
  },
  {
    label: "Outlook>Email Sending/Receiving",
    value: 11,
    displayValue: true,
  },
  {
    label: "Office Applications>Microsoft Teams>Audio/Video Quality",
    value: 11,
    displayValue: true,
  },
  {
    label: "Hardware>Desktop>Boot Failure",
    value: 11,
    displayValue: true,
  },
  {
    label: "Business Applications>CRM",
    value: 12,
    displayValue: false,
  },
  {
    label: "Network>VPN>Connection Failure",
    value: 28,
    displayValue: true,
  },
];

export const DASHBOARD_TICKETS: DashboardTicket[] = [
  {
    id: "0003132-C",
    type: "Project Task",
    summary: "Deployment and Implementati...",
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