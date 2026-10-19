/**
 * Major Incidents API Service
 * Centralized service connecting frontend Major Incidents screens
 * with live /api/major-incidents backend endpoints.
 */

import { api, ApiError, logServiceError } from './apiClient';
import {
  STAGE_LABELS,
  normaliseStatus,
} from './majorIncidents.lifecycle';
import { FALLBACK_MAJOR_INCIDENTS } from './fallback/majorIncidents.fallback';
import type {
  MajorIncident,
  IncidentUpdate,
  Priority,
  LifecycleStage,
  UserRole,
} from '../pages/MajorIncidents/types/majorIncident.types';

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
  status: string;
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

// The six-stage lifecycle vocabulary lives in its own dependency-free module
// so the offline fixtures can import it without forming a cycle with this file.
// Re-exported here because existing call sites import it from this service.
export {
  STAGE_LABELS,
  RESOLVED_STAGES,
  normaliseStatus,
  isResolvedStage,
  mapStageToBackendStatus,
  resolvedAtForStage,
} from './majorIncidents.lifecycle';
export type { StageLabel } from './majorIncidents.lifecycle';


function formatStageTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Expand a backend status into the pipeline's stage array.
 * Inverse of mapStageToBackendStatus.
 */
function buildLifecycleStages(
  backendStatus: string,
  startedAt?: string,
  resolvedAt?: string | null
): LifecycleStage[] {
  const canonical = normaliseStatus(backendStatus);
  const activeIndex = canonical ? STAGE_LABELS.indexOf(canonical) : 0;

  const formattedStarted = formatStageTime(startedAt);
  const formattedResolved = formatStageTime(resolvedAt);

  return STAGE_LABELS.map((label, idx) => ({
    label,
    isActive: idx === activeIndex,
    isCompleted: idx < activeIndex,
    timestamp:
      idx === 0
        ? formattedStarted
        : idx >= STAGE_LABELS.indexOf('Resolved') && idx <= activeIndex
        ? formattedResolved
        : undefined,
  }));
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
    if (authorLower.includes('admin') || authorLower.includes('commander')) {
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
    startedAt: backend.startedAt,
  };
}

/**
 * Tell the app this screen is rendering local fixtures because the API could
 * not be reached, so it can show the demo-data badge.
 */
function announceOfflineFallback(endpoint: string): void {
  try {
    window.dispatchEvent(
      new CustomEvent('servigen-demo-data', {
        detail: { endpoint, reason: 'API unreachable — showing local demo data' },
      })
    );
  } catch {
    // Non-browser environment
  }
}

export const majorIncidentsService = {
  /**
   * Fetch all major incidents from backend with fallback
   */
  async getMajorIncidents(filters?: { status?: string; priority?: string }): Promise<MajorIncident[]> {
    // Three distinct outcomes, kept distinct:
    //   - live rows (possibly an empty list, which is a valid answer)
    //   - API reachable but degraded: it returns its own fixtures tagged
    //     meta.source="mock"; apiClient raises `servigen-demo-data` for the badge
    //   - API unreachable: fall back to local fixtures so the screen is not
    //     blank, and announce it so the UI labels the data as demo
    try {
      const res = await api.get('/api/major-incidents', { params: filters });
      const listData = res?.data ?? res;
      if (!Array.isArray(listData)) {
        throw new ApiError('Unexpected response shape from GET /api/major-incidents', 0);
      }
      return (listData as BackendMajorIncident[]).map(mapBackendToFrontendIncident);
    } catch (error) {
      logServiceError('majorIncidents.getMajorIncidents', error);

      // Only substitute fixtures when the API could not be reached at all.
      // A 4xx/5xx from a live API is a real error the user should see.
      const unreachable = error instanceof ApiError && error.statusCode === 0;
      if (!unreachable) throw error;

      announceOfflineFallback('/api/major-incidents');
      return FALLBACK_MAJOR_INCIDENTS;
    }
  },

  /**
   * Fetch a single major incident by ID
   * GET /api/major-incidents/:id (per spec)
   */
  async getMajorIncidentById(id: string): Promise<MajorIncident | null> {
    try {
      const res = await api.get(`/api/major-incidents/${id}`);
      const singleData = res?.data ?? res;
      if (singleData && (singleData.id || singleData.title)) {
        return mapBackendToFrontendIncident(singleData as BackendMajorIncident);
      }
    } catch (error) {
      logServiceError('majorIncidents.getMajorIncidentById', error);
      // Fallback
    }

    return null;
  },

  /**
   * Declare and create a new major incident
   * POST /api/major-incidents (per spec)
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
      const createData = res?.data ?? res;
      if (createData && (createData.id || createData.title)) {
        return mapBackendToFrontendIncident(createData as BackendMajorIncident);
      }
    } catch (error) {
      logServiceError('majorIncidents.createMajorIncident', error);
      throw error;
    }

    return null;
  },

  /**
   * Update major incident fields (status, commander, priority, affectedServices, title, description, impact)
   * PATCH /api/major-incidents/:id (per spec)
   */
  async updateMajorIncident(
    id: string,
    changes: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      impact: string;
      affectedServices: string[];
      commander: string;
      assignee: string;
      resolvedAt: string | null;
    }>
  ): Promise<MajorIncident | null> {
    try {
      const payload: Record<string, any> = {};
      if (changes.title !== undefined) payload.title = changes.title;
      if (changes.description !== undefined) payload.description = changes.description;
      if (changes.status !== undefined) payload.status = changes.status;
      if (changes.resolvedAt !== undefined) payload.resolvedAt = changes.resolvedAt;
      if (changes.priority !== undefined) payload.priority = changes.priority;
      if (changes.impact !== undefined) payload.impact = changes.impact;
      if (changes.affectedServices !== undefined) payload.affectedServices = changes.affectedServices;
      if (changes.commander !== undefined) payload.commander = changes.commander;
      else if (changes.assignee !== undefined) payload.commander = changes.assignee;

      const res = await api.patch(`/api/major-incidents/${id}`, payload);
      const updateData = res?.data ?? res;
      if (updateData && (updateData.id || updateData.title)) {
        return mapBackendToFrontendIncident(updateData as BackendMajorIncident);
      }
    } catch (error) {
      logServiceError('majorIncidents.updateMajorIncident', error);
      throw error;
    }
    return null;
  },

  /**
   * Add a timeline update / comment to a major incident
   * POST /api/major-incidents/:id/updates (per spec)
   */
  async addMajorIncidentUpdate(
    incidentId: string,
    payload: { message: string; author?: string }
  ): Promise<MajorIncident | null> {
    try {
      const res = await api.post(`/api/major-incidents/${incidentId}/updates`, payload);
      const updateRes = res?.data ?? res;
      if (updateRes && (updateRes.id || updateRes.title)) {
        return mapBackendToFrontendIncident(updateRes as BackendMajorIncident);
      }
    } catch (error) {
      logServiceError('majorIncidents.addMajorIncidentUpdate', error);
      throw error;
    }
    return null;
  },
};

export default majorIncidentsService;
