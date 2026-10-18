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
      "",
    requester:
      rawTicket.requester ||
      catalogEntry.requester ||
      "",
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
        : catalogEntry.notes || [],
    site: catalogEntry.site || "EMEA",
    organisationName: catalogEntry.organisationName || catalogEntry.department || "",
    email: catalogEntry.email || "",
    phoneNumber: catalogEntry.phoneNumber || "",
    preferredNumber: catalogEntry.preferredNumber || "",
    isAgent: catalogEntry.isAgent !== undefined ? catalogEntry.isAgent : true,
    timeTaken: catalogEntry.timeTaken || "",
    fromTicketId: catalogEntry.fromTicketId || "",
    actionTitle: catalogEntry.actionTitle || `Create ${rawTicket.type || catalogEntry.type || "Project Task"}`,
    contactAddress: catalogEntry.contactAddress || [],
    assets: catalogEntry.assets || [],
    projectId: catalogEntry.projectId || "",
    projectName: catalogEntry.projectName || "",
    workflowName: catalogEntry.workflowName || "",
    createdBy: catalogEntry.createdBy || "",
    executionDate: catalogEntry.executionDate || "",
    assignedTeam: catalogEntry.assignedTeam || "1st Line Support",
    additionalAgents: catalogEntry.additionalAgents || "Not set",
    timeRecorded: catalogEntry.timeRecorded || catalogEntry.timeTaken || "",
    budgetType: catalogEntry.budgetType || "Project Management",
    timeBudget: catalogEntry.timeBudget || "",
    startDate: catalogEntry.startDate || "Not set",
    targetDate: catalogEntry.targetDate || "Not set",
    responseTarget: catalogEntry.responseTarget || "",
    responseTargetMet: catalogEntry.responseTargetMet !== undefined ? catalogEntry.responseTargetMet : true,
    resolutionTarget: catalogEntry.resolutionTarget || "",
    resolutionTargetMet: catalogEntry.resolutionTargetMet !== undefined ? catalogEntry.resolutionTargetMet : false,
    slaTime: catalogEntry.slaTime || (rawTicket as any).slaTime || "",
    pipelineStage: catalogEntry.pipelineStage || "Request Fulfillment",
    pipelineDate: catalogEntry.pipelineDate || catalogEntry.executionDate || "29/07/2026 6:22 PM",
  };
}
