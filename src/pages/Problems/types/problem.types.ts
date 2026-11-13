export type ProblemPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProblemStatus = 'New' | 'Investigation' | 'Workaround' | 'Known Error' | 'Resolved' | 'Closed';

export type ProblemStage = 'Investigation' | 'Workaround' | 'Known Error Review' | 'Resolved';

export interface ProblemLogEntry {
  id: string;
  author: string;
  authorRole?: string;
  timestamp: string;
  type: 'initial' | 'note' | 'stage_change' | 'reassign' | 'cause_update';
  content: string;
  badge?: string;
}

export interface ProblemItem {
  id: string; // e.g. "0002149"
  prefixId: string; // e.g. "PR-0002149"
  summary: string;
  description: string;
  team: string; // e.g. "Infrastructure"
  agent: string; // e.g. "Ken Yang"
  agentInitials: string; // e.g. "KY"
  priority: ProblemPriority;
  status: ProblemStatus;
  category: string; // e.g. "Business Applications"
  type: string; // "Problem"
  workflow: string; // "Problem Management Workflow"
  dateReported: string; // e.g. "17/05/2026 4:06 AM"
  timeRecorded: string; // "00:00"
  impact: string; // "High"
  currentStage: ProblemStage;
  causeStatus?: 'Identified' | 'Unknown' | 'Under Investigation';
  rootCauseDescription?: string;
  workaroundDescription?: string;
  monitoredServices: string[]; // e.g. ["Microsoft Teams"]
  childCis: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
  linkedIncidents?: Array<{
    id: string;
    summary: string;
    priority: string;
    status: string;
    dateLogged?: string;
  }>;
  endUser: {
    name: string;
    initials: string;
    organisation: string;
    site: string;
    phoneNumber: string;
    preferredNumber: string;
    address: string;
  };
  logs: ProblemLogEntry[];
}
