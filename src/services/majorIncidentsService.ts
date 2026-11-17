
import { api, ApiError, logServiceError, getApiBaseUrl } from './apiClient';
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


export function mapBackendToFrontendIncident(backend: BackendMajorIncident): MajorIncident {
  const priority: Priority = (backend.priority as string) === 'P1' || (backend.priority as string) === 'Critical' ? 'Critical' : 'High';
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

function announceOfflineFallback(endpoint: string): void {
  try {
    window.dispatchEvent(
      new CustomEvent('servigen-demo-data', {
        detail: { endpoint, reason: 'API unreachable — showing local demo data' },
      })
    );
  } catch {
  }
}

export const majorIncidentsService = {
  async getMajorIncidents(filters?: { status?: string; priority?: string }): Promise<MajorIncident[]> {
    try {
      const res = await api.get('/api/major-incidents', { params: filters });
      const listData = res?.data ?? res;
      if (!Array.isArray(listData)) {
        throw new ApiError('Unexpected response shape from GET /api/major-incidents', 0);
      }
      if (listData.length === 0) {
        return FALLBACK_MAJOR_INCIDENTS;
      }
      return (listData as BackendMajorIncident[]).map(mapBackendToFrontendIncident);
    } catch (error) {
      logServiceError('majorIncidents.getMajorIncidents', error);
      announceOfflineFallback('/api/major-incidents');
      return FALLBACK_MAJOR_INCIDENTS;
    }
  },

  async getMajorIncidentById(id: string): Promise<MajorIncident | null> {
    try {
      const res = await api.get(`/api/major-incidents/${id}`);
      const singleData = res?.data ?? res;
      if (singleData && (singleData.id || singleData.title)) {
        return mapBackendToFrontendIncident(singleData as BackendMajorIncident);
      }
    } catch (error) {
      logServiceError('majorIncidents.getMajorIncidentById', error);
    }

    return null;
  },

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

  async addMajorIncidentUpdate(
    incidentId: string,
    payload: { message: string; author?: string }
  ): Promise<MajorIncident | null> {
    try {
      const res = await api.post(`/api/major-incidents/${incidentId}/updates`, payload);
      const updateRes = res?.data ?? res;
      if (updateRes) {
        if (updateRes.id === incidentId) {
          return mapBackendToFrontendIncident(updateRes as BackendMajorIncident);
        }
        const fresh = await this.getMajorIncidentById(incidentId);
        if (fresh) return fresh;
      }
    } catch (error) {
      logServiceError('majorIncidents.addMajorIncidentUpdate', error);
      throw error;
    }
    return null;
  },

  async appendIncidentUpdate(
    incidentId: string,
    payload: { message: string; author?: string }
  ): Promise<MajorIncident | null> {
    return this.addMajorIncidentUpdate(incidentId, payload);
  },

  subscribeToIncidentStream(
    incidentId: string,
    onUpdate: (update: IncidentUpdate) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!incidentId || typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    const baseUrl = getApiBaseUrl();
    const streamUrl = `${baseUrl}/api/major-incidents/${encodeURIComponent(incidentId)}/stream`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('incident-update', (event: MessageEvent) => {
        try {
          const raw = JSON.parse(event.data);
          const mappedUpdate: IncidentUpdate = {
            id: String(raw.id || `sse-${Date.now()}`),
            timestamp: raw.createdAt
              ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: raw.author || 'System',
            authorRole: (raw.authorRole || 'Responder') as UserRole,
            type: raw.type || 'comment',
            content: raw.message || raw.content || '',
          };
          onUpdate(mappedUpdate);
        } catch (e) {
          console.warn('[MajorIncidents SSE] Failed to parse update payload:', e);
        }
      });

      eventSource.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (e) {
      if (onError) onError(e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  },
};

export default majorIncidentsService;
