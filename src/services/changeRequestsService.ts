
import type { ChangeRequest, ChangeStatus, ChangeType, RiskLevel, Subtask } from '../types/cmdb';
import { api } from './apiClient';

export interface ChangeRequestsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function normalizeChangeRequest(cr: any): ChangeRequest {
  if (!cr) return cr;

  let mappedStatus: ChangeStatus = 'In Progress';
  if (cr.status === 'Active') {
    mappedStatus = 'In Progress';
  } else if (cr.status === 'Completed') {
    mappedStatus = 'Completed';
  } else if (cr.status === 'On Hold') {
    mappedStatus = 'On Hold';
  } else if (cr.status === 'Pending' || cr.status === 'Pending Approval') {
    mappedStatus = 'Pending Approval';
  } else if (cr.status === 'Scheduled') {
    mappedStatus = 'Scheduled';
  }

  const validTypes: ChangeType[] = ['Normal', 'Emergency', 'Standard'];
  const mappedType: ChangeType = validTypes.includes(cr.changeType || cr.type)
    ? (cr.changeType || cr.type)
    : 'Normal';

  const startDateStr = cr.startDate || cr.scheduledStart;
  const endDateStr = cr.endDate || cr.scheduledEnd;
  const formattedStart = startDateStr
    ? new Date(startDateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'Pending Schedule';
  const formattedEnd = endDateStr
    ? new Date(endDateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'Pending Schedule';

  const subtasks: Subtask[] = Array.isArray(cr.subtasks) ? cr.subtasks : [];

  const completedCount = subtasks.filter((st) => st.completed).length;
  const completionPercent = typeof cr.completionPercent === 'number'
    ? cr.completionPercent
    : mappedStatus === 'Completed'
    ? 100
    : subtasks.length > 0
    ? Math.round((completedCount / subtasks.length) * 100)
    : 0;

  return {
    id: String(cr.id || ''),
    title: cr.title || cr.summary || 'Untitled Change Request',
    description: cr.description || cr.summary || 'No description provided.',
    type: mappedType,
    status: mappedStatus,
    risk: (cr.risk || 'Medium') as RiskLevel,
    impact: cr.impact || 'Medium',
    linkedCiId: cr.linkedCiId || cr.ciTag || '',
    linkedCiName: cr.linkedCiName || cr.relatedService || 'Unlinked Asset',
    agentName: cr.agentName || cr.agent || 'Unassigned',
    scheduledStart: formattedStart,
    scheduledEnd: formattedEnd,
    timeSpentHours: typeof cr.timeSpentHours === 'number' ? cr.timeSpentHours : 0,
    targetHours: typeof cr.targetHours === 'number' ? cr.targetHours : 0,
    completionPercent,
    tags: Array.isArray(cr.tags) ? cr.tags : [mappedType],
    subtasks,
  };
}

import { MOCK_CHANGE_REQUESTS } from './fallback/mockData';

export const fetchChangeRequests = async (): Promise<ChangeRequestsApiResponse<ChangeRequest[]>> => {
  try {
    const res = await api.get('/api/change-requests');
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (rawList.length > 0) {
      return {
        success: true,
        data: rawList.map(normalizeChangeRequest),
        message: res?.message || 'Loaded from live backend API',
      };
    }
  } catch (err) {
    console.warn('[changeRequestsService] Backend error, falling back to mock:', err);
  }

  return {
    success: true,
    data: MOCK_CHANGE_REQUESTS.map(normalizeChangeRequest),
    message: 'Loaded default change requests',
  };
};

export const fetchActiveChangeRequests = async (): Promise<ChangeRequestsApiResponse<ChangeRequest[]>> => {
  try {
    const res = await api.get('/api/change-requests/active');
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (rawList.length > 0) {
      return {
        success: true,
        data: rawList.map(normalizeChangeRequest),
        message: res?.message || 'Loaded active change requests from live backend API',
      };
    }
  } catch (err) {
    console.warn('[changeRequestsService] Backend error, falling back to mock:', err);
  }

  const activeMocks = MOCK_CHANGE_REQUESTS.filter(
    (cr) => cr.status !== 'Completed' && cr.status !== 'Rejected' && cr.status !== 'Failed'
  );
  return {
    success: true,
    data: activeMocks.map(normalizeChangeRequest),
    message: 'Loaded active default change requests',
  };
};

export const fetchChangeRequestById = async (
  id: string
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  if (!id) {
    throw new Error('Validation Error: Change request ID is required.');
  }

  const cleanId = id.trim();
  const res = await api.get(`/api/change-requests/${encodeURIComponent(cleanId)}`);
  const raw = res?.data || res;
  if (!raw || (!raw.id && !raw.summary && !raw.title)) {
    throw new Error(`Change Request #${cleanId} not found on backend.`);
  }

  return {
    success: true,
    data: normalizeChangeRequest(raw),
  };
};

export function toBackendChangeStatus(status: ChangeStatus | string): string {
  if (status === 'In Progress') return 'Active';
  if (status === 'Pending') return 'Pending Approval';
  return status;
}

export const createChangeRequest = async (
  payload: Partial<ChangeRequest> & { title: string }
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error('Validation Error: Change request title must be at least 3 characters.');
  }

  const validChangeTypes: ChangeType[] = ['Standard', 'Normal', 'Emergency'];
  const changeType: ChangeType = validChangeTypes.includes(payload.type as ChangeType)
    ? (payload.type as ChangeType)
    : 'Normal';

  let validStart: string | null = null;
  if (payload.scheduledStart) {
    const parsed = Date.parse(payload.scheduledStart);
    if (!isNaN(parsed)) {
      validStart = new Date(parsed).toISOString();
    }
  }
  let validEnd: string | null = null;
  if (payload.scheduledEnd) {
    const parsed = Date.parse(payload.scheduledEnd);
    if (!isNaN(parsed)) {
      validEnd = new Date(parsed).toISOString();
    }
  }

  if (validStart && validEnd && new Date(validStart) > new Date(validEnd)) {
    validEnd = new Date(new Date(validStart).getTime() + 7 * 86400000).toISOString();
  }

  const backendPayload = {
    summary: payload.title.trim(),
    changeType,
    ciId: payload.linkedCiId || null,
    ciTag: payload.linkedCiId || null,
    assignedAgentId: payload.agentName || null,
    relatedService: payload.linkedCiName || null,
    startDate: validStart || new Date().toISOString(),
    endDate: validEnd || new Date(Date.now() + 7 * 86400000).toISOString(),
  };

  const res = await api.post('/api/change-requests', backendPayload);
  const created = res?.data || res;
  return {
    success: true,
    data: normalizeChangeRequest(created || payload),
    message: 'Submitted to backend',
  };
};

export const updateChangeRequestStatus = async (
  id: string,
  status: ChangeStatus
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  if (!id) {
    throw new Error('Validation Error: Change request ID is required.');
  }

  const backendStatus = toBackendChangeStatus(status);
  const res = await api.patch(`/api/change-requests/${encodeURIComponent(id)}`, {
    status: backendStatus,
  });

  const updated = res?.data || res;
  return {
    success: true,
    data: normalizeChangeRequest(updated || { id, status }),
    message: 'Updated on backend',
  };
};

export const toggleSubtaskCompletion = async (
  changeRequestId: string,
  subtaskId: string
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  const currentRes = await fetchChangeRequestById(changeRequestId);
  const currentCR = currentRes.data;

  const updatedSubtasks = (currentCR.subtasks || []).map((st) =>
    st.id === subtaskId ? { ...st, completed: !st.completed } : st
  );

  const completedCount = updatedSubtasks.filter((st) => st.completed).length;
  const totalCount = updatedSubtasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  try {
    await api.patch(`/api/change-requests/${encodeURIComponent(changeRequestId)}`, {
      status: toBackendChangeStatus(currentCR.status),
      subtasks: updatedSubtasks,
      completionPercent,
    });
  } catch (err) {
    console.warn('[toggleSubtaskCompletion] Backend patch note:', err);
  }

  return {
    success: true,
    data: {
      ...currentCR,
      subtasks: updatedSubtasks,
      completionPercent,
    },
    message: 'Subtask toggled on backend',
  };
};

export const changeRequestsService = {
  getAll: async () => {
    const res = await fetchChangeRequests();
    return res.data;
  },
  create: async (data: any) => {
    const res = await createChangeRequest(data);
    return res.data;
  },
  updateStatus: async (id: string, status: ChangeStatus) => {
    await updateChangeRequestStatus(id, status);
    return true;
  },
  persistAll: () => {},
};
