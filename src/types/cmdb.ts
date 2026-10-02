export type CiType = 'Cloud Service' | 'Database' | 'Network' | 'Application' | 'Server' | 'Security';

export type CiStatus = 'Active' | 'Maintenance' | 'Deprecated';

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CiType;
  status: CiStatus;
  tag: string;
  environment: string;
  site: string;
  businessOwner: string;
  technicalContact: string;
  activeIncidentsCount: number;
  linkedChangesCount: number;
  lastUpdated: string;
}

export type HealthStatus = 'Operational' | 'Degraded' | 'Maintenance' | 'Outage';

export interface ServiceCI {
  id: string;
  name: string;
  category: string;
  description: string;
  healthStatus: HealthStatus;
  uptimeSlaPercent: number;
  businessOwner: string;
  supportingCisCount: number;
}

export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ChangeStatus = 'In Progress' | 'Scheduled' | 'Completed' | 'Pending Approval';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description?: string;
  type: ChangeType;
  status: ChangeStatus;
  risk: RiskLevel;
  impact: string;
  linkedCiId: string;
  linkedCiName: string;
  agentName: string;
  scheduledStart: string;
  scheduledEnd: string;
  timeSpentHours: number;
  targetHours: number;
  completionPercent: number;
  tags: string[];
  subtasks: SubTask[];
}
