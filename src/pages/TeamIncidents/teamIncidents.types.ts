export type AiRiskLevel = 'High Risk' | 'At Risk' | 'Normal';

export interface TeamIncident {
  id: string;
  sla: string;
  summary: string;
  category: string;
  agent: string;
  priority: string;
  status: string;
  type: string;
  team: "1st Line Support" | "2nd Line Support" | "Infrastructure";
  isStarred?: boolean;
  dateLogged: string;
  aiRisk?: AiRiskLevel;
  aiRiskScore?: number;
  escalatedToTier2?: boolean;
  slaTimeLeft?: number;
  slaFormatted?: string;
  resolutionTargetAt?: string;
  responseTargetAt?: string;
  slaTimeRemainingSeconds?: number;
  responseTimeRemainingSeconds?: number;
  isBreached?: boolean;
  responseBreached?: boolean;
  slaPaused?: boolean;
  responseTargetMet?: boolean;
  resolutionTargetMet?: boolean;
  holdStartedAt?: string;
  resolvedAt?: string;
  createdAt?: string;
  organisation?: string;
  requester?: string;
  site?: string;
  email?: string;
  phoneNumber?: string;
  description?: string;
  raw?: any;
}
