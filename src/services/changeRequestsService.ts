import { apiClient, type ApiResponse } from './apiClient';
import type { ChangeRequest, SubTask } from '../types/cmdb';
import { mockChangeRequests } from '../data/mockCmdbData';

const STORAGE_KEY = 'servigen_change_requests_v2';

export interface BackendChangeRequest {
  id: string;
  summary: string;
  changeType: 'Standard' | 'Normal' | 'Emergency';
  status: string;
  ciId?: string | null;
  ciTag?: string | null;
  assignedAgentId?: string | null;
  agent?: string | null;
  relatedService?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Convert Backend status to Frontend ChangeStatus
function mapBackendStatusToFrontend(status: string): ChangeRequest['status'] {
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'active' || norm === 'in progress') return 'In Progress';
  if (norm === 'pending approval' || norm === 'pending') return 'Pending Approval';
  if (norm === 'approved') return 'Pending Approval';
  if (norm === 'scheduled') return 'Scheduled';
  if (norm === 'completed') return 'Completed';
  if (norm === 'on hold') return 'On Hold';
  return 'In Progress';
}

// Convert Frontend status to Backend valid status
function mapFrontendStatusToBackend(status: ChangeRequest['status']): string {
  switch (status) {
    case 'In Progress': return 'Active';
    case 'Pending Approval': return 'Pending Approval';
    case 'Scheduled': return 'Scheduled';
    case 'Completed': return 'Completed';
    case 'On Hold': return 'On Hold';
    default: return 'Active';
  }
}

// Transform backend record into frontend ChangeRequest
function transformBackendToChangeRequest(be: BackendChangeRequest): ChangeRequest {
  const isCompleted = be.status.toLowerCase() === 'completed';
  return {
    id: be.id,
    title: be.summary || 'Change Request',
    description: `Target Configuration: ${be.ciTag || 'Infrastructure Item'}. Related Service: ${be.relatedService || 'Core Platform'}.`,
    type: (be.changeType as any) || 'Normal',
    status: mapBackendStatusToFrontend(be.status),
    risk: be.changeType === 'Emergency' ? 'High' : 'Medium',
    impact: be.changeType === 'Emergency' ? 'High' : 'Low',
    linkedCiId: be.ciId || 'CI-1001',
    linkedCiName: be.ciTag || be.relatedService || 'Primary Cluster Component',
    agentName: be.assignedAgentId || be.agent || 'Demo User',
    scheduledStart: be.startDate ? new Date(be.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 28, 2026',
    scheduledEnd: be.endDate ? new Date(be.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 04, 2026',
    timeSpentHours: isCompleted ? 8 : 4,
    targetHours: 12,
    completionPercent: isCompleted ? 100 : 40,
    tags: [be.changeType, be.relatedService || 'System'].filter(Boolean),
    subtasks: [
      { id: `#${be.id}-01`, title: 'Safety checks & backup snapshot', completed: true },
      { id: `#${be.id}-02`, title: 'Deploy configuration modification', completed: isCompleted },
      { id: `#${be.id}-03`, title: 'Health probe & service verification', completed: isCompleted },
    ],
    linkedRequestId: be.relatedService && be.relatedService.startsWith('SR-') ? be.relatedService : undefined,
  };
}

export const changeRequestsService = {
  /**
   * Get all change requests from backend API, merging with local/fallback cache
   */
  async getAll(): Promise<ChangeRequest[]> {
    let localData: ChangeRequest[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localData = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    if (!localData || localData.length === 0) {
      localData = [...mockChangeRequests];
    }

    try {
      const res = await apiClient.get<ApiResponse<BackendChangeRequest[]> | BackendChangeRequest[]>('/api/change-requests');
      const items = Array.isArray(res) ? res : (res && res.data && Array.isArray(res.data) ? res.data : []);
      if (items.length > 0) {
        const remoteCRs = items.map(transformBackendToChangeRequest);
        // Merge remote items, preferring remote data for matching IDs
        const combined = [...remoteCRs];
        localData.forEach((loc) => {
          if (!combined.some((c) => c.id.toLowerCase() === loc.id.toLowerCase())) {
            combined.push(loc);
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        return combined;
      }
    } catch (err) {
      console.warn('API /api/change-requests fetch failed; using cached/mock records:', err);
    }

    return localData;
  },

  /**
   * Create a new change request, pushing to backend and persisting locally
   */
  async create(data: {
    title: string;
    description?: string;
    type: ChangeRequest['type'];
    risk?: ChangeRequest['risk'];
    linkedCiName?: string;
    agentName?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    targetHours?: number;
    linkedRequestId?: string;
    linkedRequestSummary?: string;
  }): Promise<ChangeRequest> {
    const newId = `CR-${Math.floor(2000 + Math.random() * 8000)}`;

    const newCR: ChangeRequest = {
      id: newId,
      title: data.title,
      description: data.description || 'Change request implementation plan',
      type: data.type,
      status: 'In Progress',
      risk: data.risk || 'Medium',
      impact: 'Medium',
      linkedCiId: 'CI-1000',
      linkedCiName: data.linkedCiName || 'Cloud Gateway & Infrastructure',
      agentName: data.agentName || 'Demo User',
      scheduledStart: data.scheduledStart || 'Sep 29, 2026',
      scheduledEnd: data.scheduledEnd || 'Oct 05, 2026',
      timeSpentHours: 0,
      targetHours: data.targetHours || 16,
      completionPercent: 0,
      tags: [data.type, data.linkedRequestId ? 'Service-Request-Linked' : 'Infrastructure'],
      subtasks: [
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Safety check & pre-implementation review', completed: true },
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Execute planned deployment / modification', completed: false },
        { id: `#${Math.floor(3000 + Math.random() * 1000)}`, title: 'Validation testing & service signoff', completed: false },
      ],
      linkedRequestId: data.linkedRequestId,
      linkedRequestSummary: data.linkedRequestSummary,
    };

    // Try posting to backend if server available
    try {
      const payload = {
        summary: data.title,
        changeType: data.type,
        ciTag: data.linkedCiName || 'INFRA-01',
        relatedService: data.linkedRequestId ? `Request #${data.linkedRequestId}` : 'Core Platform',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
      const res = await apiClient.post<ApiResponse<BackendChangeRequest> | BackendChangeRequest>('/api/change-requests', payload);
      if (res && 'data' in res && res.data) {
        newCR.id = res.data.id;
      } else if (res && 'id' in res && typeof res.id === 'string') {
        newCR.id = res.id;
      }
    } catch (err) {
      console.warn('Backend POST /api/change-requests failed; stored locally:', err);
    }

    // Save to local storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: ChangeRequest[] = stored ? JSON.parse(stored) : mockChangeRequests;
      const updated = [newCR, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newCR;
  },

  /**
   * Update status of an existing change request
   */
  async updateStatus(id: string, newStatus: ChangeRequest['status']): Promise<boolean> {
    try {
      const backendStatus = mapFrontendStatusToBackend(newStatus);
      await apiClient.patch(`/api/change-requests/${encodeURIComponent(id)}`, {
        status: backendStatus,
      });
    } catch (err) {
      console.warn(`Backend PATCH /api/change-requests/${id} failed; updated locally:`, err);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing: ChangeRequest[] = JSON.parse(stored);
        const updated = existing.map((cr) => (cr.id === id ? { ...cr, status: newStatus } : cr));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    return true;
  },

  /**
   * Save full change requests array to persistent storage
   */
  persistAll(items: ChangeRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  },
};
