/**
 * Major Incidents API Service
 * Centralized service connecting frontend Major Incidents screens
 * with live /api/major-incidents backend endpoints.
 */

import { api } from './apiClient';
import type {
  MajorIncident,
  IncidentUpdate,
  Priority,
  LifecycleStage,
  UserRole,
} from '../pages/MajorIncidents/types/majorIncident.types';
import { MOCK_MAJOR_INCIDENTS } from '../pages/MajorIncidents/data/mockData';

export interface BackendMajorIncidentUpdate {
  id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface BackendMajorIncident {
  id: string;
  title: string;
  description: string;
  status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  priority: 'P1' | 'P2';
  impact: string;
  affectedServices: string[];
  commander: string;
  startedAt: string;
  resolvedAt: string | null;
  updates: BackendMajorIncidentUpdate[];
}

export interface CreateMajorIncidentPayload {
  title: string;
  description?: string;
  priority: Priority;
  product?: string;
  assignee?: string;
}

const STAGE_LABELS = ['Started', 'Escalated', 'Diagnosed', 'Mitigated', 'Resolved', 'Closed'] as const;

/**
 * Maps backend status to frontend lifecycle stages array.
 */
function buildLifecycleStages(
  backendStatus: BackendMajorIncident['status'],
  startedAt?: string,
  resolvedAt?: string | null
): LifecycleStage[] {
  let activeIndex = 0;
  switch (backendStatus) {
    case 'Investigating':
      activeIndex = 1; // Escalated / Diagnosed
      break;
    case 'Identified':
      activeIndex = 2; // Diagnosed
      break;
    case 'Monitoring':
      activeIndex = 3; // Mitigated
      break;
    case 'Resolved':
      activeIndex = resolvedAt ? 5 : 4; // Resolved or Closed
      break;
    default:
      activeIndex = 0;
  }

  const formattedStarted = startedAt
    ? new Date(startedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const formattedResolved = resolvedAt
    ? new Date(resolvedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return STAGE_LABELS.map((label, idx) => ({
    label,
    isActive: idx === activeIndex,
    isCompleted: idx < activeIndex || (backendStatus === 'Resolved' && idx === 5 && Boolean(resolvedAt)),
    timestamp: idx === 0 ? formattedStarted : idx === 4 || idx === 5 ? formattedResolved : undefined,
  }));
}

/**
 * Maps frontend lifecycle stage index to backend status.
 */
export function mapStageToBackendStatus(stageIndex: number): 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved' {
  if (stageIndex <= 1) return 'Investigating';
  if (stageIndex === 2) return 'Identified';
  if (stageIndex === 3) return 'Monitoring';
  return 'Resolved';
}

/**
 * Converts a backend major incident object to the frontend MajorIncident shape.
 */
export function mapBackendToFrontendIncident(backend: BackendMajorIncident): MajorIncident {
  const priority: Priority = backend.priority === 'P1' ? 'Critical' : 'High';
  const product = Array.isArray(backend.affectedServices) && backend.affectedServices.length > 0
    ? backend.affectedServices.join(', ')
    : 'Core Platform';

  const updates: IncidentUpdate[] = (backend.updates || []).map((u) => {
    const formattedTime = u.createdAt
      ? new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now';

    let role: UserRole = 'Agent';
    const authorLower = (u.author || '').toLowerCase();
    if (authorLower.includes('admin') || authorLower.includes('inesh') || authorLower.includes('commander')) {
      role = 'Admin';
    } else if (authorLower.includes('lead') || authorLower.includes('manager')) {
      role = 'Manager';
    }

    return {
      id: u.id,
      timestamp: formattedTime,
      author: u.author || 'System',
      authorRole: role,
      type: 'comment',
      content: u.message,
    };
  });

  return {
    id: backend.id,
    title: backend.title,
    priority,
    product,
    resolutionTarget: backend.resolvedAt ? 'Completed' : '0d 4h 0m',
    responseTarget: '15m SLA',
    assignee: backend.commander || 'Unassigned',
    lifecycleStages: buildLifecycleStages(backend.status, backend.startedAt, backend.resolvedAt),
    updates,
  };
}

export const majorIncidentsService = {
  /**
   * Fetch all major incidents from backend with fallback
   */
  async getMajorIncidents(filters?: { status?: string; priority?: string }): Promise<MajorIncident[]> {
    try {
      const res = await api.get('/api/major-incidents', { params: filters });
      if (res?.success && Array.isArray(res.data)) {
        const liveList = (res.data as BackendMajorIncident[]).map(mapBackendToFrontendIncident);
        return liveList;
      }
    } catch {
      // Backend unavailable or offline fallback
    }

    return MOCK_MAJOR_INCIDENTS;
  },

  /**
   * Fetch a single major incident by ID
   */
  async getMajorIncidentById(id: string): Promise<MajorIncident | null> {
    try {
      const res = await api.get(`/api/major-incidents/${id}`);
      if (res?.success && res.data) {
        return mapBackendToFrontendIncident(res.data as BackendMajorIncident);
      }
    } catch {
      // Fallback
    }

    return MOCK_MAJOR_INCIDENTS.find((i) => i.id === id) || null;
  },

  /**
   * Declare and create a new major incident
   */
  async createMajorIncident(payload: CreateMajorIncidentPayload): Promise<MajorIncident | null> {
    try {
      const backendPriority: 'P1' | 'P2' = payload.priority === 'Critical' ? 'P1' : 'P2';
      const affectedServices = payload.product && payload.product.trim()
        ? [payload.product.trim()]
        : ['Core Platform'];

      const body = {
        title: payload.title,
        description: payload.description || payload.title,
        priority: backendPriority,
        impact: payload.priority === 'Critical' ? 'Critical Service Disruption' : 'High Performance Degradation',
        affectedServices,
        commander: payload.assignee || 'Unassigned',
      };

      const res = await api.post('/api/major-incidents', body);
      if (res?.success && res.data) {
        return mapBackendToFrontendIncident(res.data as BackendMajorIncident);
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Update major incident fields (status, commander, priority, affectedServices)
   */
  async updateMajorIncident(
    id: string,
    changes: Partial<{
      title: string;
      description: string;
      status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
      priority: 'P1' | 'P2';
      impact: string;
      affectedServices: string[];
      commander: string;
    }>
  ): Promise<MajorIncident | null> {
    try {
      const res = await api.patch(`/api/major-incidents/${id}`, changes);
      if (res?.success && res.data) {
        return mapBackendToFrontendIncident(res.data as BackendMajorIncident);
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Add a timeline update / comment to a major incident
   */
  async addMajorIncidentUpdate(
    incidentId: string,
    payload: { message: string; author?: string }
  ): Promise<MajorIncident | null> {
    try {
      const res = await api.post(`/api/major-incidents/${incidentId}/updates`, payload);
      if (res?.success && res.data) {
        return mapBackendToFrontendIncident(res.data as BackendMajorIncident);
      }
    } catch {
      // Fallback
    }
    return null;
  },
};

export default majorIncidentsService;
