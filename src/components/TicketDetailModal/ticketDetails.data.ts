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

export const MOCK_TICKET_CATALOG: Record<string, Partial<FullTicket>> = {};

export const AVAILABLE_AGENTS = [
  "Alex Agent",
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
      "Support Requester",
    department:
      rawTicket.department || catalogEntry.department || "IT Operations",
    category:
      rawTicket.category || catalogEntry.category || "General Support",
    createdAt:
      rawTicket.createdAt || catalogEntry.createdAt || "Just now",
    targetSla:
      rawTicket.targetSla ||
      catalogEntry.targetSla ||
      (rawTicket.priority === 'Critical'
        ? "Target SLA: Within 1 hour"
        : rawTicket.priority === 'High'
        ? "Target SLA: Within 2 hours"
        : "Target SLA: Within 4 hours"),
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
