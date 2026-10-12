export type TicketPriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Unassigned";

export type TicketNote = {
  id: string;
  author: string;
  time: string;
  text: string;
};

export type FullTicket = {
  id: string;
  type: string;
  summary: string;
  agent: string;
  priority: TicketPriority;
  status?: string;
  description?: string;
  requester?: string;
  department?: string;
  category?: string;
  createdAt?: string;
  targetSla?: string;
  notes?: TicketNote[];
};

export const MOCK_TICKET_CATALOG: Record<string, Partial<FullTicket>> = {
  "0003132-C": {
    type: "Project Task",
    summary: "Deployment and Implementation of Production Hotfix 4.2",
    priority: "Low",
    status: "In Progress",
    agent: "Inesh Agarwal",
    requester: "Priya Sharma (Release Manager)",
    department: "Core Engineering",
    category: "Infrastructure > Production Deployment",
    createdAt: "12 Oct 2026, 09:15 AM",
    targetSla: "2 days remaining (14 Oct 2026, 18:00)",
    description:
      "Deployment and implementation of Production Hotfix 4.2 patch. Requirements include validating database migration scripts, executing pre-flight canary tests on staging clusters, and coordinating maintenance window with customer success teams. Rollback scripts must be verified prior to production deployment.",
    notes: [
      {
        id: "n-1",
        author: "Priya Sharma",
        time: "12 Oct 2026, 09:30 AM",
        text: "Canary build 4.2-rc3 passed unit testing in staging environment.",
      },
      {
        id: "n-2",
        author: "Inesh Agarwal",
        time: "12 Oct 2026, 11:15 AM",
        text: "Database migration schema validated against staging replica.",
      },
    ],
  },
  "0003013": {
    type: "Service Request",
    summary: "Update email display name across Google Workspace & Directory",
    priority: "Medium",
    status: "Open",
    agent: "Anjali Prasad",
    requester: "Kavita Rao (Marketing Lead)",
    department: "Marketing & Communications",
    category: "Business Applications > Google Workspace",
    createdAt: "12 Oct 2026, 11:30 AM",
    targetSla: "4 hours remaining (12 Oct 2026, 17:30)",
    description:
      "User recently changed legal surname and needs the primary display name updated across Google Workspace, Slack, Zoom, and Azure Active Directory. Email alias has already been configured; please synchronize the global address list (GAL).",
    notes: [
      {
        id: "n-1",
        author: "Kavita Rao",
        time: "12 Oct 2026, 11:35 AM",
        text: "Attached marriage certificate and legal name affidavit to HR portal ticket HR-4019.",
      },
    ],
  },
  "0003012": {
    type: "Service Request",
    summary: "Request external monitor for workstation B-42",
    priority: "High",
    status: "Open",
    agent: "Durgesh Kumar",
    requester: "Rahul Verma (UI/UX Designer)",
    department: "Design & Product",
    category: "Hardware > Peripherals > Monitor",
    createdAt: "12 Oct 2026, 10:45 AM",
    targetSla: "2 hours remaining (12 Oct 2026, 16:45)",
    description:
      "User requests a 27-inch 4K external monitor with USB-C Power Delivery for dual-screen design workflow at Bangalore HQ Desk B-42. Manager approval attached in procurement portal. Needs DisplayPort / USB-C cabling included.",
    notes: [
      {
        id: "n-1",
        author: "Durgesh Kumar",
        time: "12 Oct 2026, 11:00 AM",
        text: "Checked IT asset inventory: 2x Dell UltraSharp 27\" available in Bangalore IT depot.",
      },
    ],
  },
  "0003011": {
    type: "Service Request",
    summary: "Install Adobe Acrobat Pro and license activation",
    priority: "Low",
    status: "In Progress",
    agent: "Nainesh Patel",
    requester: "Aman Gupta (Legal Counsel)",
    department: "Legal & Compliance",
    category: "Software > Enterprise Licensing",
    createdAt: "11 Oct 2026, 04:20 PM",
    targetSla: "1 day remaining (13 Oct 2026, 16:20)",
    description:
      "Requesting installation and enterprise license assignment for Adobe Acrobat Pro on corporate laptop (Asset TAG: LT-8842). Needed for redlining enterprise contracts, OCR extraction, and digital certificate signing.",
    notes: [
      {
        id: "n-1",
        author: "Nainesh Patel",
        time: "11 Oct 2026, 05:00 PM",
        text: "Enterprise Creative Cloud license assigned to user profile. Remote software push initiated.",
      },
    ],
  },
  "0003010": {
    type: "Service Request",
    summary: "Access request for Finance FY27-Audit shared folder",
    priority: "Medium",
    status: "Open",
    agent: "Monalisa Panda",
    requester: "Deepak Mehta (Financial Analyst)",
    department: "Finance & Accounting",
    category: "Security > Access Management",
    createdAt: "12 Oct 2026, 01:10 PM",
    targetSla: "3 hours remaining (12 Oct 2026, 17:10)",
    description:
      "User requires Read/Write permissions to '\\\\corp-fileshare\\Finance\\FY27-Audit' for upcoming quarterly financial closing. Line manager approval granted via email ticket ref #FM-882.",
    notes: [
      {
        id: "n-1",
        author: "Deepak Mehta",
        time: "12 Oct 2026, 01:15 PM",
        text: "Need access by end of day for quarterly audit spreadsheet reconciliations.",
      },
    ],
  },
  "0003009": {
    type: "Service Request",
    summary: "Request new laptop for new staff onboarding",
    priority: "High",
    status: "Open",
    agent: "Mohammad Taha Ali",
    requester: "Siddharth Jain (HR Operations)",
    department: "Human Resources",
    category: "Hardware > Laptop Provisioning",
    createdAt: "12 Oct 2026, 08:30 AM",
    targetSla: "Target: Friday 5:00 PM (16 Oct 2026)",
    description:
      "New Senior Frontend Engineer joining the team next Monday, Oct 19. Requesting standard developer laptop (MacBook Pro 16\" M3 Max or Dell XPS 15, 32GB RAM) pre-imaged with corporate VPN, security agents, and developer tooling.",
    notes: [
      {
        id: "n-1",
        author: "Mohammad Taha Ali",
        time: "12 Oct 2026, 09:00 AM",
        text: "Unit allocated from stock. Scheduled for image deployment via Jamf Pro.",
      },
    ],
  },
  "0002673-P": {
    type: "Major Incident",
    summary: "System Login Failure - SSO Gateway Timeout",
    priority: "Critical",
    status: "In Progress",
    agent: "Inesh Agarwal",
    requester: "Automated Monitoring (Datadog)",
    department: "Identity & Access Infrastructure",
    category: "Security > Multi-Factor Authentication > SSO",
    createdAt: "12 Oct 2026, 02:05 PM",
    targetSla: "Critical SLA: 25 mins remaining",
    description:
      "SSO Gateway is returning HTTP 504 Gateway Timeout intermittently for users attempting to log into cloud services and internal ERP. Incident bridge opened on bridge-alpha. Identity engineering team investigating token validation service latency.",
    notes: [
      {
        id: "n-1",
        author: "Datadog Monitor",
        time: "12 Oct 2026, 02:05 PM",
        text: "Alert triggered: SSO Gateway 5xx rate exceeded 15% threshold over 5-minute sliding window.",
      },
      {
        id: "n-2",
        author: "Inesh Agarwal",
        time: "12 Oct 2026, 02:18 PM",
        text: "Traffic rerouted to secondary auth cluster in us-west-2. Error rate decreased to 3%.",
      },
    ],
  },
  "0002237": {
    type: "Service Request",
    summary: "Request Addition of New Network Printer (Floor 3 East)",
    priority: "Low",
    status: "Open",
    agent: "Aditya Kumar Singh",
    requester: "Rohan Kapoor (Admin Facilities)",
    department: "Facilities & Workplace",
    category: "Hardware > Network Printing",
    createdAt: "10 Oct 2026, 11:00 AM",
    targetSla: "2 days remaining (14 Oct 2026)",
    description:
      "Requesting IP reservation and print server spooler setup for newly installed HP LaserJet Enterprise MFP M528 on Floor 3 East Wing. Static IP requested: 10.20.14.88.",
    notes: [
      {
        id: "n-1",
        author: "Aditya Kumar Singh",
        time: "11 Oct 2026, 10:00 AM",
        text: "IP 10.20.14.88 reserved in DHCP scope. Print server queue created.",
      },
    ],
  },
  "0002236": {
    type: "Service Request",
    summary: "Request Printer Maintenance Service for Floor 2 Canon",
    priority: "Low",
    status: "Open",
    agent: "Voona Sarayu",
    requester: "Meera Nair (Front Desk Reception)",
    department: "Facilities & Workplace",
    category: "Hardware > Maintenance",
    createdAt: "09 Oct 2026, 03:15 PM",
    targetSla: "Scheduled for tomorrow 11:00 AM",
    description:
      "Floor 2 reception printer (Canon imageRUNNER) is throwing intermittent paper feed jam error code 50.1. Pick-up rollers and waste toner box require inspection and replacement by vendor technician.",
    notes: [
      {
        id: "n-1",
        author: "Voona Sarayu",
        time: "10 Oct 2026, 09:30 AM",
        text: "Canon field engineer dispatch scheduled for tomorrow morning.",
      },
    ],
  },
};

export const AVAILABLE_AGENTS = [
  "Inesh Agarwal",
  "Anjali Prasad",
  "Durgesh Kumar",
  "Nainesh Patel",
  "Monalisa Panda",
  "Mohammad Taha Ali",
  "Aditya Kumar Singh",
  "Voona Sarayu",
  "Unassigned",
];

export const AVAILABLE_STATUSES = [
  "Open",
  "In Progress",
  "Pending Approval",
  "On Hold",
  "Resolved",
];

export const AVAILABLE_PRIORITIES: TicketPriority[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Unassigned",
];

/**
 * Enriches any ticket (from storage or mock) with full detailed fields.
 */
export function enrichTicketDetails(rawTicket: {
  id: string;
  type?: string;
  summary?: string;
  agent?: string;
  priority?: TicketPriority;
  status?: string;
  description?: string;
  requester?: string;
  department?: string;
  category?: string;
  createdAt?: string;
  targetSla?: string;
  notes?: TicketNote[];
}): FullTicket {
  const catalogEntry = MOCK_TICKET_CATALOG[rawTicket.id] || {};

  return {
    id: rawTicket.id,
    type: rawTicket.type || catalogEntry.type || "Service Request",
    summary:
      catalogEntry.summary && rawTicket.summary?.endsWith("...")
        ? catalogEntry.summary
        : rawTicket.summary || catalogEntry.summary || `Ticket ${rawTicket.id}`,
    agent: rawTicket.agent || catalogEntry.agent || "Unassigned",
    priority: rawTicket.priority || catalogEntry.priority || "Medium",
    status: rawTicket.status || catalogEntry.status || "Open",
    description:
      rawTicket.description ||
      catalogEntry.description ||
      `Detailed request specifications and log records for ticket ${rawTicket.id}. Please review assigned parameters and take necessary resolution action.`,
    requester:
      rawTicket.requester ||
      catalogEntry.requester ||
      "Inesh Agarwal (ServiGen User)",
    department:
      rawTicket.department || catalogEntry.department || "IT Operations",
    category:
      rawTicket.category || catalogEntry.category || "General Support",
    createdAt:
      rawTicket.createdAt || catalogEntry.createdAt || "12 Oct 2026, 12:00 PM",
    targetSla:
      rawTicket.targetSla || catalogEntry.targetSla || "Target SLA: Within 4 hours",
    notes:
      rawTicket.notes && rawTicket.notes.length > 0
        ? rawTicket.notes
        : catalogEntry.notes || [
            {
              id: "n-init",
              author: "System",
              time: "Just now",
              text: `Ticket ${rawTicket.id} registered in ServiGen queue.`,
            },
          ],
  };
}
