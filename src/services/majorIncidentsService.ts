/**
 * Major Incidents API Service
 * Centralized service connecting frontend Major Incidents screens
 * with live /api/major-incidents backend endpoints.
 */

import { api, logServiceError } from './apiClient';
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

/**
 * The six-stage major-incident lifecycle, identical to the backend's
 * LIFECYCLE_STAGES (backend/src/modules/major-incidents/major-incidents.lifecycle.js)
 * and to the Figma pipeline. Because both sides share one vocabulary, the two
 * mappers below are inverses — previously they were not, which made 'Started'
 * unreachable and rendered 'Resolved' as 'Closed'.
 */
export const STAGE_LABELS = [
  'Started',
  'Escalated',
  'Diagnosed',
  'Mitigated',
  'Resolved',
  'Closed',
] as const;

export type StageLabel = (typeof STAGE_LABELS)[number];

const RESOLVED_STAGES: readonly string[] = ['Resolved', 'Closed'];

/**
 * Pre-2026-10 four-status vocabulary. Retained so the UI renders correctly
 * against a backend that has not yet deployed the six-stage change, and for
 * rows written before the data migration.
 */
const LEGACY_STATUS_MAP: Record<string, StageLabel> = {
  investigating: 'Started',
  identified: 'Diagnosed',
  monitoring: 'Mitigated',
  resolved: 'Resolved',
  closed: 'Closed',
};

/** Normalise any accepted status spelling to a canonical stage label. */
export function normaliseStatus(value: string | null | undefined): StageLabel | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  const exact = STAGE_LABELS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  return LEGACY_STATUS_MAP[trimmed.toLowerCase()] ?? null;
}

export function isResolvedStage(status: string | null | undefined): boolean {
  const canonical = normaliseStatus(status);
  return canonical !== null && RESOLVED_STAGES.includes(canonical);
}

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
 * Collapse a pipeline index into the backend status.
 * Inverse of buildLifecycleStages.
 */
export function mapStageToBackendStatus(stageIndex: number): StageLabel {
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_LABELS.length) {
    return STAGE_LABELS[0];
  }
  return STAGE_LABELS[stageIndex];
}

/**
 * The resolvedAt value that should accompany a move to `stageIndex`.
 * Returning null (rather than omitting it) is what re-opens an incident.
 */
export function resolvedAtForStage(stageIndex: number): string | null {
  return isResolvedStage(STAGE_LABELS[stageIndex]) ? new Date().toISOString() : null;
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

export const majorIncidentsService = {
  /**
   * Fetch all major incidents from backend with fallback
   */
  async getMajorIncidents(filters?: { status?: string; priority?: string }): Promise<MajorIncident[]> {
    // Throws on failure. Returning [] for both "no incidents" and "request
    // failed" is what made an unreachable database look like an empty queue,
    // and let callers keep showing stale rows indefinitely.
    const res = await api.get('/api/major-incidents', { params: filters });
    const listData = res?.data ?? res;
    if (!Array.isArray(listData)) {
      throw new Error('Unexpected response shape from GET /api/major-incidents');
    }
    return (listData as BackendMajorIncident[]).map(mapBackendToFrontendIncident);
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
