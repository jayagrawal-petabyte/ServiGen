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

export interface UserAsset {
  id: string;
  type: string;
  icon: "workstation" | "phone" | "monitor" | "laptop";
}

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
  site?: string;
  organisationName?: string;
  email?: string;
  phoneNumber?: string;
  preferredNumber?: string;
  isAgent?: boolean;
  timeTaken?: string;
  fromTicketId?: string;
  actionTitle?: string;
  contactAddress?: string[];
  assets?: UserAsset[];
  projectId?: string;
  projectName?: string;
  workflowName?: string;
  createdBy?: string;
  executionDate?: string;
  assignedTeam?: string;
  additionalAgents?: string;
  timeRecorded?: string;
  budgetType?: string;
  timeBudget?: string;
  startDate?: string;
  targetDate?: string;
  responseTarget?: string;
  resolutionTarget?: string;
  responseTargetMet?: boolean;
  resolutionTargetMet?: boolean;
  slaTime?: string;
  pipelineStage?: string;
  pipelineDate?: string;
};

export const MOCK_TICKET_CATALOG: Record<string, Partial<FullTicket>> = {
  "0003910": {
    type: "Incident",
    summary: "Screen share button does not work",
    priority: "Medium",
    status: "In Progress",
    agent: "Anjali Prasad",
    requester: "Devon Vance (Field Operations)",
    department: "Corporate IT Support",
    category: "Office Applications > Collaboration",
    createdAt: "15 Oct 2026, 14:20 PM",
    targetSla: "SLA remaining: -18:53 (Breached)",
    description:
      "User reports the screen share button in the unified conferencing client becomes unresponsive when attempting to present multi-display setups. Audio continues uninterrupted but video frame remains blank for remote attendees. Initial cache clear did not resolve.",
    notes: [
      {
        id: "n-3910-1",
        author: "Anjali Prasad",
        time: "15 Oct 2026, 14:35 PM",
        text: "Requested client debug logs from user workstation. GPU hardware acceleration toggle tested.",
      },
      {
        id: "n-3910-2",
        author: "Devon Vance",
        time: "15 Oct 2026, 15:10 PM",
        text: "Sent logs via secure portal. Issue only reproduces on external 4K monitor.",
      },
    ],
  },
  "0003576": {
    type: "Incident",
    summary: "Audio echo looping when two people join",
    priority: "Low",
    status: "In Progress",
    agent: "Mohammad Taha Ali",
    requester: "Sarah Jenkins (Human Resources)",
    department: "Talent Acquisition",
    category: "Collaboration Tools > Audio/Video",
    createdAt: "15 Oct 2026, 11:05 AM",
    targetSla: "SLA remaining: -88:01 (Breached)",
    description:
      "Acoustic echo cancellation feedback loop occurs whenever two or more users join conference room B-10 meeting link simultaneously from laptops while room microphone bar is engaged. Requires DSP audio profile reset.",
    notes: [
      {
        id: "n-3576-1",
        author: "Mohammad Taha Ali",
        time: "15 Oct 2026, 11:40 AM",
        text: "Checked room hardware firmware. Polycom studio bar requires pending audio profile patch.",
      },
    ],
  },
  "0003575": {
    type: "Incident",
    summary: "Audio echo looping when two people join",
    priority: "Low",
    status: "In Progress",
    agent: "Demo User",
    requester: "Sarah Jenkins (Human Resources)",
    department: "Talent Acquisition",
    category: "Collaboration Tools > Audio/Video",
    createdAt: "20/07/2026",
    targetSla: "SLA remaining: -88:01 (Breached)",
    description:
      "Acoustic echo cancellation feedback loop occurs whenever two or more users join conference room B-10 meeting link simultaneously from laptops while room microphone bar is engaged. Requires DSP audio profile reset.",
    notes: [
      {
        id: "n-3575-1",
        author: "Demo User",
        time: "20/07/2026",
        text: "Checked room hardware firmware. Polycom studio bar requires pending audio profile patch.",
      },
    ],
  },
  "0003357": {
    type: "Incident",
    summary: "Account locked while working from home",
    priority: "Medium",
    status: "In Progress",
    agent: "Monalisa Panda",
    requester: "Carlos Mendez (Finance)",
    department: "Financial Operations",
    category: "Security > Identity & Access",
    createdAt: "15 Oct 2026, 15:45 PM",
    targetSla: "Target SLA: 05:05 remaining",
    description:
      "User active directory domain account was automatically locked out after 5 consecutive bad password attempts originating from a background credential sync daemon on secondary iOS mobile device. Verification via SMS OTP completed.",
    notes: [
      {
        id: "n-3357-1",
        author: "Monalisa Panda",
        time: "15 Oct 2026, 16:00 PM",
        text: "Identity verified via corporate mobile authenticator. Reset lockout counter in Azure AD.",
      },
    ],
  },
  "0003269": {
    type: "Incident",
    summary: "VPN worked yesterday, now says unavailable",
    priority: "Medium",
    status: "In Progress",
    agent: "Aditya Kumar Singh",
    requester: "Mei Lin (Engineering)",
    department: "Core Platform",
    category: "Network > Remote Access VPN",
    createdAt: "15 Oct 2026, 15:50 PM",
    targetSla: "Target SLA: 05:05 remaining",
    description:
      "Client VPN gateway handshake fails with TLS certificate authority error code 741. IPsec tunnel establishes but DNS resolution to internal development cluster times out. Certificate CRL cache invalidation recommended.",
    notes: [
      {
        id: "n-3269-1",
        author: "Aditya Kumar Singh",
        time: "15 Oct 2026, 16:15 PM",
        text: "Examined VPN gateway radius logs. User client version 3.2.1 requires update to 3.2.4.",
      },
    ],
  },
  "0003132": {
    type: "Project Task",
    summary: "Deployment and Implementation Review",
    priority: "Low",
    status: "New",
    agent: "Demo User",
    requester: "Demo User",
    department: "consultancy",
    organisationName: "consultancy",
    site: "EMEA",
    email: "jagath.varshan@softrateglobal.com",
    phoneNumber: "4644354",
    preferredNumber: "01449 833111",
    isAgent: true,
    timeTaken: "70:15",
    fromTicketId: "#2196",
    actionTitle: "Create Project Task",
    category: "Infrastructure > Production Deployment",
    createdAt: "17/05/2026 4:06 AM",
    targetSla: "2 days remaining (14 Oct 2026, 18:00)",
    assignedTeam: "1st Line Support",
    additionalAgents: "Not set",
    timeRecorded: "70:15",
    budgetType: "Project Management",
    timeBudget: "05:00",
    startDate: "Not set",
    targetDate: "Not set",
    executionDate: "06/11/2025 10:56 PM",
    pipelineStage: "Task Execution",
    pipelineDate: "06/11/2025 10:56 PM",
    contactAddress: [
      "Halo House, Gipping Way",
      "Stowmarket",
      "Suffolk",
      "United Kingdom",
      "Ip14 1GJ",
    ],
    assets: [
      { id: "ABC00001", type: "Workstation", icon: "workstation" },
      { id: "ABC00002", type: "Mobile Phone", icon: "phone" },
      { id: "ABC00007", type: "Monitor", icon: "monitor" },
      { id: "ABC00008", type: "Laptop", icon: "laptop" },
    ],
    description:
      "Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders.",
    notes: [
      {
        id: "n-1",
        author: "Admin (You)",
        time: "17/05/2026 4:06 AM",
        text: "Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders.",
      },
    ],
  },
  "0003132-C": {
    type: "Project Task",
    summary: "Deployment and Implementation Review",
    priority: "Low",
    status: "New",
    agent: "Admin (You)",
    requester: "Admin (You)",
    department: "consultancy",
    organisationName: "consultancy",
    site: "EMEA",
    email: "jagath.varshan@softrateglobal.com",
    phoneNumber: "4644354",
    preferredNumber: "01449 833111",
    isAgent: true,
    timeTaken: "70:15",
    fromTicketId: "#2196",
    actionTitle: "Create Project Task",
    category: "Infrastructure > Production Deployment",
    createdAt: "17/05/2026 4:06 AM",
    targetSla: "2 days remaining (14 Oct 2026, 18:00)",
    assignedTeam: "1st Line Support",
    additionalAgents: "Not set",
    timeRecorded: "70:15",
    budgetType: "Project Management",
    timeBudget: "05:00",
    startDate: "Not set",
    targetDate: "Not set",
    executionDate: "06/11/2025 10:56 PM",
    pipelineStage: "Task Execution",
    pipelineDate: "06/11/2025 10:56 PM",
    contactAddress: [
      "Halo House, Gipping Way",
      "Stowmarket",
      "Suffolk",
      "United Kingdom",
      "Ip14 1GJ",
    ],
    assets: [
      { id: "ABC00001", type: "Workstation", icon: "workstation" },
      { id: "ABC00002", type: "Mobile Phone", icon: "phone" },
      { id: "ABC00007", type: "Monitor", icon: "monitor" },
      { id: "ABC00008", type: "Laptop", icon: "laptop" },
    ],
    description:
      "Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders.",
    notes: [
      {
        id: "n-1",
        author: "Admin (You)",
        time: "17/05/2026 4:06 AM",
        text: "Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders.",
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
  "0003988": {
    type: "Service Request",
    summary: "Would like my desk phone extension updated after moving to the new floor",
    priority: "Low",
    status: "New",
    agent: "Unassigned",
    assignedTeam: "1st Line Support",
    additionalAgents: "Not set",
    timeRecorded: "00:00",
    requester: "Aisha Khan",
    department: "Corporate Operations",
    category: "Service Desk Portal>Catalog>Item Update",
    createdAt: "27/07/2026 4:44 PM",
    executionDate: "29/07/2026 6:22 PM",
    pipelineStage: "Request Fulfillment",
    pipelineDate: "29/07/2026 6:22 PM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "akhan@usehalo.com",
    phoneNumber: "01632 960101",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "-32:01",
    responseTarget: "01/09/2026 10:29 PM",
    responseTargetMet: true,
    resolutionTarget: "10/09/2026 10:29 PM",
    resolutionTargetMet: false,
    description:
      "Moved desks on Friday and calls are still routing to my old extension. Not urgent since I mostly use my mobile, but would like it corrected when convenient.",
    notes: [
      {
        id: "n-3988-1",
        author: "Aisha Khan",
        time: "27/07/2026 4:44 PM",
        text: "Moved desks on Friday and calls are still routing to my old extension. Not urgent since I mostly use my mobile, but would like it corrected when convenient.",
      },
    ],
  },
  "3988": {
    type: "Service Request",
    summary: "Would like my desk phone extension updated after moving to the new floor",
    priority: "Low",
    status: "New",
    agent: "Unassigned",
    assignedTeam: "1st Line Support",
    additionalAgents: "Not set",
    timeRecorded: "00:00",
    requester: "Aisha Khan",
    department: "Corporate Operations",
    category: "Service Desk Portal>Catalog>Item Update",
    createdAt: "27/07/2026 4:44 PM",
    executionDate: "29/07/2026 6:22 PM",
    pipelineStage: "Request Fulfillment",
    pipelineDate: "29/07/2026 6:22 PM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "akhan@usehalo.com",
    phoneNumber: "01632 960101",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "-32:01",
    responseTarget: "01/09/2026 10:29 PM",
    responseTargetMet: true,
    resolutionTarget: "10/09/2026 10:29 PM",
    resolutionTargetMet: false,
    description:
      "Moved desks on Friday and calls are still routing to my old extension. Not urgent since I mostly use my mobile, but would like it corrected when convenient.",
    notes: [
      {
        id: "n-3988-1",
        author: "Aisha Khan",
        time: "27/07/2026 4:44 PM",
        text: "Moved desks on Friday and calls are still routing to my old extension. Not urgent since I mostly use my mobile, but would like it corrected when convenient.",
      },
    ],
  },
  "3840": {
    type: "Incident",
    summary: "Getting an unacceptable credentials error whenever I try to connect over VPN",
    priority: "Low",
    status: "Closed",
    agent: "Demo User",
    requester: "David Miller",
    department: "Corporate Operations",
    category: "Network>VPN>Connection Failure",
    createdAt: "12/05/2026 7:50 PM",
    executionDate: "12/05/2026 7:50 PM",
    pipelineStage: "Resolution",
    pipelineDate: "13/05/2026 10:15 AM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "dmiller@usehalo.com",
    phoneNumber: "01632 944102",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "00:00",
    responseTarget: "12/05/2026 8:50 PM",
    responseTargetMet: true,
    resolutionTarget: "13/05/2026 7:50 PM",
    resolutionTargetMet: true,
    description:
      "Getting an unacceptable credentials error whenever I try to connect over VPN. Password cache expired in RADIUS authentication pool. Credentials resynced.",
    notes: [
      {
        id: "n-3840-1",
        author: "David Miller",
        time: "12/05/2026 7:50 PM",
        text: "Getting an unacceptable credentials error whenever I try to connect over VPN.",
      },
    ],
  },
  "3841": {
    type: "Incident",
    summary: "VPN connects for a few seconds then drops back to disconnected on its own",
    priority: "Medium",
    status: "With User",
    agent: "Demo User",
    requester: "Claire Bennett",
    department: "Finance",
    category: "Network>VPN>Connection Failure",
    createdAt: "28/08/2026 10:29 PM",
    executionDate: "28/08/2026 10:29 PM",
    pipelineStage: "Investigation",
    pipelineDate: "28/08/2026 11:05 PM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "cbennett@usehalo.com",
    phoneNumber: "01632 955310",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "+14:22",
    responseTarget: "28/08/2026 11:29 PM",
    responseTargetMet: true,
    resolutionTarget: "29/08/2026 10:29 PM",
    resolutionTargetMet: false,
    description:
      "VPN connects for a few seconds then drops back to disconnected on its own. Tunnel keepalive MTU packets dropped. Awaiting user modem test.",
    notes: [
      {
        id: "n-3841-1",
        author: "Claire Bennett",
        time: "28/08/2026 10:29 PM",
        text: "VPN connects for a few seconds then drops back to disconnected on its own.",
      },
    ],
  },
  "3842": {
    type: "Incident",
    summary: "Multi factor prompts for VPN aren't arriving on my phone during login",
    priority: "High",
    status: "Closed",
    agent: "Jennifer Williams",
    requester: "Robert Evans",
    department: "Sales",
    category: "Network>VPN>Connection Failure",
    createdAt: "11/05/2026 1:37 PM",
    executionDate: "11/05/2026 1:37 PM",
    pipelineStage: "Resolution",
    pipelineDate: "11/05/2026 3:45 PM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "revans@usehalo.com",
    phoneNumber: "01632 977421",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "00:00",
    responseTarget: "11/05/2026 2:07 PM",
    responseTargetMet: true,
    resolutionTarget: "11/05/2026 5:37 PM",
    resolutionTargetMet: true,
    description:
      "Multi factor prompts for VPN aren't arriving on my phone during login. Authenticator push token re-registered on company portal.",
    notes: [
      {
        id: "n-3842-1",
        author: "Robert Evans",
        time: "11/05/2026 1:37 PM",
        text: "Multi factor prompts for VPN aren't arriving on my phone during login.",
      },
    ],
  },
  "3843": {
    type: "Incident",
    summary: "VPN is extremely unstable on this hotel's wireless network this week",
    priority: "Low",
    status: "Closed",
    agent: "James Brown",
    requester: "Susan Wright",
    department: "Field Services",
    category: "Network>VPN>Connection Failure",
    createdAt: "10/07/2026 9:33 PM",
    executionDate: "10/07/2026 9:33 PM",
    pipelineStage: "Resolution",
    pipelineDate: "11/07/2026 8:00 AM",
    organisationName: "consultancy",
    site: "EMEA",
    email: "swright@usehalo.com",
    phoneNumber: "01632 988312",
    preferredNumber: "01449 833111",
    targetSla: "Incident SLA",
    slaTime: "00:00",
    responseTarget: "10/07/2026 10:33 PM",
    responseTargetMet: true,
    resolutionTarget: "11/07/2026 9:33 PM",
    resolutionTargetMet: true,
    description:
      "VPN is extremely unstable on this hotel's wireless network this week. Captive portal throttled UDP tunnel. Switched client config to TCP 443.",
    notes: [
      {
        id: "n-3843-1",
        author: "Susan Wright",
        time: "10/07/2026 9:33 PM",
        text: "VPN is extremely unstable on this hotel's wireless network this week.",
      },
    ],
  },
  "0003987": {
    type: "Incident",
    summary: "Desktop shows a blue screen with CRITICAL_PROCESS_DIED on reboot",
    priority: "High",
    status: "In Progress",
    agent: "Unassigned",
    requester: "Karthik Nair (Engineering)",
    department: "Workplace Technology",
    category: "Hardware > OS Crash > BSOD",
    createdAt: "14 Oct 2026, 08:30 AM",
    targetSla: "SLA Breached (-88:01 remaining)",
    description:
      "Workstation Dell OptiPlex encountering recurrent Blue Screen of Death (STOP code: CRITICAL_PROCESS_DIED) following security agent update. Memory dump analysis required.",
    notes: [
      {
        id: "n-sla-2",
        author: "System",
        time: "1h 28m ago",
        text: "Response SLA breached (-88:01). Priority: High.",
      },
    ],
  },
  "0003986": {
    type: "Incident",
    summary: "New phone is stuck on 'applying security policy' loop",
    priority: "Medium",
    status: "Open",
    agent: "Unassigned",
    requester: "Sunita Rao (Sales Executive)",
    department: "Mobile Device Management",
    category: "Mobile > MDM Enrollment",
    createdAt: "14 Oct 2026, 08:50 AM",
    targetSla: "SLA Breached (-64:00 remaining)",
    description:
      "Corporate iPhone 15 stuck in continuous MDM enrollment profile loop after initial setup assistant. Needs Intune device certificate re-issued.",
    notes: [
      {
        id: "n-sla-3",
        author: "System",
        time: "1h 04m ago",
        text: "SLA breached (-64:00). Awaiting MDM administrator triage.",
      },
    ],
  },
  "0003985": {
    type: "Incident",
    summary: "My camera shows as available but screen is completely black in Zoom/Teams",
    priority: "Medium",
    status: "Open",
    agent: "Unassigned",
    requester: "Rohan Varma (Product Manager)",
    department: "Collaboration Tools",
    category: "Software > Video Conferencing",
    createdAt: "14 Oct 2026, 09:10 AM",
    targetSla: "SLA Breached (-40:01 remaining)",
    description:
      "Integrated web camera LED turns green indicating active capture, but video feeds in Zoom and Microsoft Teams render a pitch-black frame. Camera privacy slider is confirmed open and privacy permissions verified.",
    notes: [
      {
        id: "n-sla-4",
        author: "System",
        time: "40 mins ago",
        text: "SLA breach warning. Ticket unassigned for > 2 hours.",
      },
    ],
  },
  "0003984": {
    type: "Incident",
    summary: "Network shared drive mapped to Z: inaccessible after subnet migration",
    priority: "High",
    status: "Open",
    agent: "Unassigned",
    requester: "Anita Desai (Finance Operations)",
    department: "Network Infrastructure",
    category: "Network > File Shares > SMB",
    createdAt: "14 Oct 2026, 08:45 AM",
    targetSla: "SLA Breached (-72:15 remaining)",
    description:
      "Finance department users reporting SMB file share '\\\\fs01.corp\\finance' fails with network path not found (0x80070035) following overnight firewall routing migration.",
    notes: [
      {
        id: "n-sla-5",
        author: "System",
        time: "1h 12m ago",
        text: "Critical SLA warning for Finance team shared drive.",
      },
    ],
  },
  "0003980": {
    type: "Service Request",
    summary: "Toner is running low on the printer in Finance bay",
    priority: "Low",
    status: "Open",
    agent: "Unassigned",
    requester: "Suresh Menon (Accounts)",
    department: "Facilities & Operations",
    category: "Hardware > Printer Consumables",
    createdAt: "14 Oct 2026, 09:25 AM",
    targetSla: "SLA Breached (-40:01 remaining)",
    description:
      "Black toner cartridge below 5% warning on Floor 3 HP LaserJet Enterprise. Replacement cartridge needed from supply inventory.",
    notes: [
      {
        id: "n-sla-6",
        author: "System",
        time: "40 mins ago",
        text: "Automated alert from printer management console.",
      },
    ],
  },
  "0003979": {
    type: "Incident",
    summary: "Can't see my direct reports' timesheets in HR portal",
    priority: "Medium",
    status: "Open",
    agent: "Unassigned",
    requester: "Geeta Patel (Engineering Manager)",
    department: "Human Resources IT",
    category: "Business Applications > Workday",
    createdAt: "14 Oct 2026, 08:40 AM",
    targetSla: "SLA Breached (-88:01 remaining)",
    description:
      "Line manager cannot view or approve weekly timesheets for newly transferred team members in Workday portal. Security group mapping needs audit.",
    notes: [
      {
        id: "n-sla-7",
        author: "System",
        time: "1h 28m ago",
        text: "Response SLA breached (-88:01). Requires Workday security administrator.",
      },
    ],
  },
  "0003983": {
    type: "Incident",
    summary: "External keyboard and mouse stop responding on USB-C dock",
    priority: "Medium",
    status: "Open",
    agent: "Unassigned",
    requester: "Kunal Shah (Product Design)",
    department: "Workplace Technology",
    category: "Hardware > Peripherals > Docking Station",
    createdAt: "14 Oct 2026, 08:35 AM",
    targetSla: "SLA Breached (-88:01 remaining)",
    description:
      "Peripherals connected via Dell Thunderbolt 4 Dock WD22TB4 randomly drop power every 20-30 minutes during video calls. Firmware update and Thunderbolt security controller driver reinstall needed.",
    notes: [
      {
        id: "n-sla-8",
        author: "System",
        time: "1h 30m ago",
        text: "Ticket flagged by user. Docking station swapped with test unit.",
      },
    ],
  },
  "0003982": {
    type: "Incident",
    summary: "Monthly financial reporting query timing out after 15 minutes",
    priority: "High",
    status: "In Progress",
    agent: "Unassigned",
    requester: "Pooja Hegde (Finance Controller)",
    department: "Financial Operations",
    category: "Business Applications > Oracle ERP",
    createdAt: "14 Oct 2026, 08:20 AM",
    targetSla: "SLA Breached (-64:00 remaining)",
    description:
      "Oracle ERP ledger trial balance export times out with gateway 504 error. Month-end financial reporting cannot proceed until query execution plan is optimized or index rebuilt.",
    notes: [
      {
        id: "n-sla-9",
        author: "Pooja Hegde",
        time: "14 Oct 2026, 08:25 AM",
        text: "Finance close deadline is end of day today.",
      },
    ],
  },
  "0003981": {
    type: "Service Request",
    summary: "Need addition to Executive Leadership team shared calendar",
    priority: "Low",
    status: "Open",
    agent: "Unassigned",
    requester: "Rohan Varma (Executive Assistant)",
    department: "Executive Operations",
    category: "Collaboration > Calendar Delegation",
    createdAt: "14 Oct 2026, 08:15 AM",
    targetSla: "SLA Breached (-40:01 remaining)",
    description:
      "User requires Delegate with Full Edit permissions to Executive Leadership team calendar on Microsoft Exchange Online for executive board meeting scheduling.",
    notes: [
      {
        id: "n-sla-10",
        author: "System",
        time: "40 mins ago",
        text: "Awaiting line manager approval.",
      },
    ],
  },
  "0003025": {
    type: "Incident",
    summary: "Salesforce CRM opportunity pipeline export failing with 413 Payload Too Large",
    priority: "Critical",
    status: "In Progress",
    agent: "Inesh Agarwal",
    requester: "Vikram Malhotra (VP Global Sales)",
    department: "Commercial & Sales Operations",
    category: "Business Applications > Salesforce CRM",
    createdAt: "16 Oct 2026, 12:45 PM",
    targetSla: "Critical SLA: 45 mins remaining",
    description:
      "Quarterly pipeline export failing on bulk REST API request with HTTP 413 Payload Too Large. Field sales managers unable to pull revenue projections ahead of Board review. Requires adjusting client batch chunk size to 2,000 records.",
    notes: [
      {
        id: "n-3025-1",
        author: "Vikram Malhotra",
        time: "16 Oct 2026, 12:48 PM",
        text: "Need urgent resolution before executive committee meeting at 3 PM.",
      },
      {
        id: "n-3025-2",
        author: "Inesh Agarwal",
        time: "16 Oct 2026, 12:55 PM",
        text: "Identified batch API serialization issue. Reconfiguring middleware pagination gateway.",
      },
    ],
  },
  "0003024": {
    type: "Service Request",
    summary: "GitHub Enterprise organization invite for newly hired backend engineer",
    priority: "High",
    status: "Open",
    agent: "Nainesh Patel",
    requester: "Priya Sharma (Engineering Director)",
    department: "Core Engineering",
    category: "Developer Tools > GitHub Enterprise",
    createdAt: "16 Oct 2026, 12:35 PM",
    targetSla: "Target SLA: 2 hours remaining",
    description:
      "Requesting SSO SAML provisioning and member invitation to 'servigen-corp' GitHub Enterprise organization for new backend engineer joining the payments pod. Needs access to repositories: core-api, payments-service, and infra-terraform.",
    notes: [
      {
        id: "n-3024-1",
        author: "Priya Sharma",
        time: "16 Oct 2026, 12:40 PM",
        text: "Approved by Engineering Director. Fast-track onboarding.",
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
  const cleanedId = (rawTicket.id || "").replace(/^[#\s]+/, "");
  const strippedId = cleanedId.replace(/-C$/, "");
  const paddedId = strippedId.padStart(7, "0");
  const unpaddedId = strippedId.replace(/^0+/, "");
  const catalogEntry =
    MOCK_TICKET_CATALOG[rawTicket.id] ||
    MOCK_TICKET_CATALOG[cleanedId] ||
    MOCK_TICKET_CATALOG[strippedId] ||
    MOCK_TICKET_CATALOG[paddedId] ||
    MOCK_TICKET_CATALOG[unpaddedId] ||
    {};

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
              author: "Admin (You)",
              time: catalogEntry.createdAt || "17/05/2026 4:06 AM",
              text:
                catalogEntry.description ||
                rawTicket.description ||
                `Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders.`,
            },
          ],
    site: catalogEntry.site || "EMEA",
    organisationName: catalogEntry.organisationName || catalogEntry.department || "consultancy",
    email: catalogEntry.email || "jagath.varshan@softrateglobal.com",
    phoneNumber: catalogEntry.phoneNumber || "4644354",
    preferredNumber: catalogEntry.preferredNumber || "01449 833111",
    isAgent: catalogEntry.isAgent !== undefined ? catalogEntry.isAgent : true,
    timeTaken: catalogEntry.timeTaken || "70:15",
    fromTicketId: catalogEntry.fromTicketId || "#2196",
    actionTitle: catalogEntry.actionTitle || `Create ${rawTicket.type || catalogEntry.type || "Project Task"}`,
    contactAddress: catalogEntry.contactAddress || [
      "Halo House, Gipping Way",
      "Stowmarket",
      "Suffolk",
      "United Kingdom",
      "Ip14 1GJ",
    ],
    assets: catalogEntry.assets || [
      { id: "ABC00001", type: "Workstation", icon: "workstation" },
      { id: "ABC00002", type: "Mobile Phone", icon: "phone" },
      { id: "ABC00007", type: "Monitor", icon: "monitor" },
      { id: "ABC00008", type: "Laptop", icon: "laptop" },
    ],
    projectId: catalogEntry.projectId || "2196",
    projectName: catalogEntry.projectName || "2196 - Halo Implementation - Project",
    workflowName: catalogEntry.workflowName || "Task Management Workflow",
    createdBy: catalogEntry.createdBy || "Admin",
    executionDate: catalogEntry.executionDate || "06/11/2025 10:56 PM",
    assignedTeam: catalogEntry.assignedTeam || "1st Line Support",
    additionalAgents: catalogEntry.additionalAgents || "Not set",
    timeRecorded: catalogEntry.timeRecorded || catalogEntry.timeTaken || "70:15",
    budgetType: catalogEntry.budgetType || "Project Management",
    timeBudget: catalogEntry.timeBudget || "05:00",
    startDate: catalogEntry.startDate || "Not set",
    targetDate: catalogEntry.targetDate || "Not set",
    responseTarget: catalogEntry.responseTarget || "01/09/2026 10:29 PM",
    responseTargetMet: catalogEntry.responseTargetMet !== undefined ? catalogEntry.responseTargetMet : true,
    resolutionTarget: catalogEntry.resolutionTarget || "10/09/2026 10:29 PM",
    resolutionTargetMet: catalogEntry.resolutionTargetMet !== undefined ? catalogEntry.resolutionTargetMet : false,
    slaTime: catalogEntry.slaTime || (rawTicket as any).slaTime || "-32:01",
    pipelineStage: catalogEntry.pipelineStage || "Request Fulfillment",
    pipelineDate: catalogEntry.pipelineDate || catalogEntry.executionDate || "29/07/2026 6:22 PM",
  };
}
