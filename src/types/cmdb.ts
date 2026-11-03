export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type ChangeStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'In Progress'
  | 'Scheduled'
  | 'On Hold'
  | 'Completed'
  | 'Rejected'
  | 'Failed';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ImpactLevel = 'Low' | 'Medium' | 'High';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  durationMinutes?: number;
}

export type SubTask = Subtask;

export interface CabReview {
  reviewDate?: string;
  decision: 'Pending' | 'Approved' | 'Rejected';
  decisionBy?: string;
  cabNotes?: string;
}

export interface RollbackPlan {
  steps: Subtask[];
  estimatedDurationMinutes?: number;
  contingencyOwner?: string;
  verificationProcedure?: string;
}

export interface PostImplementationReview {
  reviewDate?: string;
  outcome?: 'Successful' | 'Successful with Issues' | 'Failed';
  reviewedBy?: string;
  lessonsLearned?: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description?: string;
  type: ChangeType;
  status: ChangeStatus;
  risk: RiskLevel;
  impact: ImpactLevel | string;
  urgency?: 'Low' | 'Medium' | 'High';
  riskScore?: number;
  linkedCiId: string;
  linkedCiName: string;
  agentName: string;
  scheduledStart: string;
  scheduledEnd: string;
  timeSpentHours: number;
  targetHours: number;
  completionPercent: number;
  tags: string[];
  subtasks: Subtask[];
  linkedRequestId?: string;
  linkedRequestSummary?: string;
  cabReview?: CabReview;
  rollbackPlan?: RollbackPlan;
  postImplementationReview?: PostImplementationReview;
  freezeWindowConflict?: boolean;
}

export type CiType = 'Cloud Service' | 'Database' | 'Network' | 'Application' | 'Server' | 'Security';
export type CiStatus = 'Active' | 'Maintenance' | 'Deprecated';
export type CiLifecycleState = 'Ordered' | 'In Stock' | 'Deployed' | 'Maintenance' | 'Retired';

export interface CiRelationship {
  type: 'depends_on' | 'runs_on' | 'backed_up_by' | 'connected_to';
  targetCiId: string;
  targetCiName: string;
  targetCiTag: string;
  direction: 'upstream' | 'downstream';
}

export interface CiSpecification {
  ipAddress?: string;
  os?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  macAddress?: string;
  serialNumber?: string;
  model?: string;
  rackLocation?: string;
}

export interface CiSoftwareLicense {
  name: string;
  licenseKeyMasked: string;
  expiryDate: string;
  seatsTotal: number;
  seatsAllocated: number;
}

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CiType;
  tag: string;
  site: string;
  status: CiStatus;
  lifecycleState?: CiLifecycleState;
  businessOwner: string;
  technicalContact: string;
  environment: string;
  activeIncidentsCount: number;
  linkedChangesCount: number;
  ipAddress?: string;
  lastUpdated?: string;
  specifications?: CiSpecification;
  relationships?: CiRelationship[];
  softwareLicenses?: CiSoftwareLicense[];
  criticality?: 'Tier 1 - Mission Critical' | 'Tier 2 - Business Operational' | 'Tier 3 - Supporting';
}

export type GroupedConfigurationItems = Record<string, ConfigurationItem[]>;

export type ServiceHealthStatus = 'Operational' | 'Degraded' | 'Maintenance' | 'Outage';
export type HealthStatus = ServiceHealthStatus;

export interface ServiceCI {
  id: string;
  name: string;
  category: string;
  healthStatus: ServiceHealthStatus;
  uptimeSlaPercent: number;
  businessOwner: string;
  supportingCisCount: number;
  description: string;
  lastIncidentDate?: string;
}
