export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type ChangeStatus = 'In Progress' | 'On Hold' | 'Pending Approval' | 'Scheduled' | 'Completed';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ImpactLevel = 'Low' | 'Medium' | 'High';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type SubTask = Subtask;

export interface ChangeRequest {
  id: string;
  title: string;
  description?: string;
  type: ChangeType;
  status: ChangeStatus;
  risk: RiskLevel;
  impact: ImpactLevel | string;
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
}

export type CiType = 'Cloud Service' | 'Database' | 'Network' | 'Application' | 'Server' | 'Security';
export type CiStatus = 'Active' | 'Maintenance' | 'Deprecated';

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CiType;
  tag: string;
  site: string;
  status: CiStatus;
  businessOwner: string;
  technicalContact: string;
  environment: string;
  activeIncidentsCount: number;
  linkedChangesCount: number;
  ipAddress?: string;
  lastUpdated?: string;
}

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
