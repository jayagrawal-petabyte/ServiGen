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
    value: 12,
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
    organisation: "ServiGen Global Tech",
  },
  {
    id: "0003982",
    subject: "Monthly reporting query has been delayed",
    priority: "High",
    status: "In Progress",
    date: "17 Sep 2026",
    description:
      "Monthly reporting query is taking longer than expected to complete.",
    assignedTo: "Anjali Prasad",
    organisation: "ServiGen Global Tech",
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
    organisation: "ServiGen Global Tech",
  },
  {
    id: "0003980",
    subject: "Toner is running low on the printer",
    priority: "Low",
    status: "Open",
    date: "16 Sep 2026",
    description:
      "The printer toner is running low and needs replacement.",
    assignedTo: "Durgesh Kumar",
    organisation: "ServiGen Global Tech",
  },
  {
    id: "0003979",
    subject: "Can't see my direct reports' timesheets",
    priority: "Medium",
    status: "In Progress",
    date: "16 Sep 2026",
    description:
      "The user cannot access timesheet information for direct reports.",
    assignedTo: "Inesh Agarwal",
    organisation: "ServiGen Global Tech",
  },
  {
    id: "0003978",
    subject: "Core payment gateway 504 timeout during checkout",
    priority: "Critical",
    status: "In Progress",
    date: "15 Sep 2026",
    description:
      "Checkout service intermittently timing out when charging European credit cards.",
    assignedTo: "Inesh Agarwal",
    organisation: "Meridian Foods Ltd",
  },
  {
    id: "0003977",
    subject: "Workstation BitLocker recovery key request",
    priority: "High",
    status: "Resolved",
    date: "15 Sep 2026",
    description:
      "User rebooted after firmware update and requires BitLocker recovery key to boot.",
    assignedTo: "Aditya Kumar Singh",
    organisation: "Northbridge Logistics",
  },
  {
    id: "0003976",
    subject: "Active Directory password expiry sync lag",
    priority: "Medium",
    status: "Resolved",
    date: "14 Sep 2026",
    description:
      "Password reset through portal did not replicate to on-prem domain controllers within SLA.",
    assignedTo: "Mohammad Taha Ali",
    organisation: "Solace Retail Group",
  },
  {
    id: "0003975",
    subject: "Docking station dual display flickering on USB-C",
    priority: "Low",
    status: "On Hold",
    date: "14 Sep 2026",
    description:
      "Display flickering intermittently when laptop is connected via Thunderbolt 4 dock. Awaiting vendor firmware update.",
    assignedTo: "Monalisa Panda",
    organisation: "Aurelia Health",
  },
  {
    id: "0003974",
    subject: "ERP production database high CPU alert (>95%)",
    priority: "Critical",
    status: "Resolved",
    date: "13 Sep 2026",
    description:
      "Automated batch query pegged database CPU at 98% causing API timeouts. Query optimized and index added.",
    assignedTo: "Inesh Agarwal",
    organisation: "Meridian Foods Ltd",
  },
  {
    id: "0003973",
    subject: "Zoom Room audio conference mic muted hardware glitch",
    priority: "Medium",
    status: "Resolved",
    date: "13 Sep 2026",
    description:
      "Meeting room 4B ceiling microphone array failed to initialize upon meeting join.",
    assignedTo: "Anjali Prasad",
    organisation: "ServiGen Global Tech",
  },
  {
    id: "0003972",
    subject: "Salesforce CRM integration sync failure for UK leads",
    priority: "High",
    status: "On Hold",
    date: "12 Sep 2026",
    description:
      "OAuth token expired on Salesforce web hook. Awaiting authorization approval from IT Security.",
    assignedTo: "Durgesh Kumar",
    organisation: "Solace Retail Group",
  },
  {
    id: "0003971",
    subject: "Request developer admin privilege on local Docker environment",
    priority: "Low",
    status: "Resolved",
    date: "12 Sep 2026",
    description:
      "Software engineer needs local admin permission to build and run containerized microservices.",
    assignedTo: "Aditya Kumar Singh",
    organisation: "ServiGen Global Tech",
  },
];

export const NEW_TICKETS: NewTicket[] = [
  {
    id: "0003132",
    type: "Project Task",
    summary: "Deployment and Implementation Review",
    agent: "Admin (You)",
    priority: "Low",
  },
  {
    id: "0003132-C",
    type: "Project Task",
    summary: "Deployment and Implementation of Production Hotfix 4.2",
    agent: "Inesh Agarwal",
    priority: "Low",
  },
  {
    id: "0003025",
    type: "Incident",
    summary: "Salesforce CRM opportunity pipeline export failing with 413 Payload Too Large",
    agent: "Inesh Agarwal",
    priority: "Critical",
  },
  {
    id: "0003024",
    type: "Service Request",
    summary: "GitHub Enterprise organization invite for newly hired backend engineer",
    agent: "Nainesh Patel",
    priority: "High",
  },
  {
    id: "0003013",
    type: "Service Request",
    summary: "Update email display name across Google Workspace & Directory",
    agent: "Anjali Prasad",
    priority: "Medium",
  },
  {
    id: "0003012",
    type: "Service Request",
    summary: "Request external monitor for workstation B-42",
    agent: "Durgesh Kumar",
    priority: "High",
  },
  {
    id: "0003011",
    type: "Service Request",
    summary: "Install Adobe Acrobat Pro and license activation",
    agent: "Nainesh Patel",
    priority: "Low",
  },
  {
    id: "0003010",
    type: "Service Request",
    summary: "Access request for Finance FY27-Audit shared folder",
    agent: "Monalisa Panda",
    priority: "Medium",
  },
  {
    id: "0003009",
    type: "Service Request",
    summary: "Request new laptop for new staff onboarding",
    agent: "Mohammad Taha Ali",
    priority: "High",
  },
  {
    id: "0002673-P",
    type: "Major Incident",
    summary: "System Login Failure - SSO Gateway Timeout",
    agent: "Inesh Agarwal",
    priority: "Critical",
  },
  {
    id: "0002237",
    type: "Service Request",
    summary: "Request Addition of New Network Printer (Floor 3 East)",
    agent: "Aditya Kumar Singh",
    priority: "Low",
  },
  {
    id: "0002236",
    type: "Service Request",
    summary: "Request Printer Maintenance Service for Floor 2 Canon",
    agent: "Voona Sarayu",
    priority: "Low",
  },
  {
    id: "0003988",
    type: "Service Request",
    summary: "Would like desk phone extension routed to WebRTC softphone",
    agent: "Unassigned",
    priority: "Low",
  },
  {
    id: "0003987",
    type: "Incident",
    summary: "Desktop shows blue screen with CRITICAL_PROCESS_DIED on reboot",
    agent: "Unassigned",
    priority: "High",
  },
  {
    id: "0003986",
    type: "Incident",
    summary: "Corporate iPhone stuck on applying security policy loop",
    agent: "Unassigned",
    priority: "Medium",
  },
  {
    id: "0003985",
    type: "Incident",
    summary: "Integrated camera black frame in Zoom and Teams meetings",
    agent: "Unassigned",
    priority: "Medium",
  },
  {
    id: "0003984",
    type: "Incident",
    summary: "Network shared drive mapped to Z: inaccessible after subnet migration",
    agent: "Unassigned",
    priority: "High",
  },
  {
    id: "0003983",
    type: "Incident",
    summary: "External keyboard and mouse stop responding on USB-C dock",
    agent: "Unassigned",
    priority: "Medium",
  },
  {
    id: "0003982",
    type: "Incident",
    summary: "Monthly financial reporting query timing out after 15 minutes",
    agent: "Unassigned",
    priority: "High",
  },
  {
    id: "0003981",
    type: "Service Request",
    summary: "Need addition to Executive Leadership team shared calendar",
    agent: "Unassigned",
    priority: "Low",
  },
  {
    id: "0003980",
    type: "Service Request",
    summary: "Replacement toner cartridge requested for Finance laser printer",
    agent: "Unassigned",
    priority: "Low",
  },
  {
    id: "0003979",
    type: "Incident",
    summary: "Manager unable to view direct reports time tracking sheets",
    agent: "Unassigned",
    priority: "Medium",
  },
  {
    id: "0003910",
    type: "Incident",
    summary: "Screen share button unresponsive on dual 4K external monitors",
    agent: "Anjali Prasad",
    priority: "Medium",
  },
  {
    id: "0003576",
    type: "Incident",
    summary: "Acoustic audio echo feedback loop in Conference Room B-10",
    agent: "Mohammad Taha Ali",
    priority: "Low",
  },
  {
    id: "0003357",
    type: "Incident",
    summary: "Active Directory account locked out during remote work session",
    agent: "Monalisa Panda",
    priority: "Medium",
  },
  {
    id: "0003269",
    type: "Incident",
    summary: "GlobalProtect VPN connection handshake failing with TLS error 741",
    agent: "Aditya Kumar Singh",
    priority: "Medium",
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