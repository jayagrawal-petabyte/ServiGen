export type ProblemPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProblemStatus = 'New' | 'Investigation' | 'Workaround' | 'Known Error' | 'Resolved' | 'Closed';

export type ProblemStage = 'Investigation' | 'Workaround' | 'Known Error Review' | 'Resolved';

export interface PirData {
  rootCauseCategory: string;
  executiveSummary: string;
  preventiveActions: string;
  lessonsLearned: string;
  targetDate: string;
  completedAt: string;
  leadInvestigator: string;
}

export interface ProblemLogEntry {
  id: string;
  author: string;
  authorRole?: string;
  timestamp: string;
  type: 'initial' | 'note' | 'stage_change' | 'reassign' | 'cause_update' | 'pir_complete' | 'kb_publish';
  content: string;
  badge?: string;
}

export interface ProblemItem {
  id: string;
  prefixId: string;
  summary: string;
  description: string;
  team: string;
  agent: string;
  agentInitials: string;
  priority: ProblemPriority;
  status: ProblemStatus;
  category: string;
  type: string;
  workflow: string;
  dateReported: string;
  timeRecorded: string;
  impact: string;
  currentStage: ProblemStage;
  causeStatus?: 'Identified' | 'Unknown' | 'Under Investigation';
  rootCauseDescription?: string;
  workaroundDescription?: string;
  pirData?: PirData;
  monitoredServices: string[];
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
