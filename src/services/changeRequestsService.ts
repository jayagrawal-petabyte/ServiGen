/**
 * Servigen Change Requests Service Layer
 * Corresponds to Servigen API Specification Section 5.15 (Change Requests Module)
 *
 * Backend Routes (Mounted at /api/change-requests):
 * - GET /api/change-requests        : List all change requests
 * - GET /api/change-requests/active : List active change requests
 * - GET /api/change-requests/:id    : Get change request details
 */

import type { ChangeRequest, ChangeStatus, ChangeType, RiskLevel, Subtask } from '../types/cmdb';
import { api } from './apiClient';

export interface ChangeRequestsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Normalize raw backend record into standard ChangeRequest interface
 */
export function normalizeChangeRequest(cr: any): ChangeRequest {
  if (!cr) return cr;

  // Map backend status ('Active', 'Completed', 'Pending') to frontend ChangeStatus
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

  // Map backend changeType ('Normal', 'Emergency', 'Standard')
  const validTypes: ChangeType[] = ['Normal', 'Emergency', 'Standard'];
  const mappedType: ChangeType = validTypes.includes(cr.changeType || cr.type)
    ? (cr.changeType || cr.type)
    : 'Normal';

  // Format dates
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

/**
 * Fetch all change requests from live backend
 * Endpoint: GET /api/change-requests
 */
export const fetchChangeRequests = async (): Promise<ChangeRequestsApiResponse<ChangeRequest[]>> => {
  const res = await api.get('/api/change-requests');
  const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  const normalized = rawList.map(normalizeChangeRequest);

  return {
    success: true,
    data: normalized,
    message: res?.message || 'Loaded from live backend API',
  };
};

/**
 * Fetch active change requests from live backend
 * Endpoint: GET /api/change-requests/active
 */
export const fetchActiveChangeRequests = async (): Promise<ChangeRequestsApiResponse<ChangeRequest[]>> => {
  const res = await api.get('/api/change-requests/active');
  const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  const normalized = rawList.map(normalizeChangeRequest);

  return {
    success: true,
    data: normalized,
    message: res?.message || 'Loaded active change requests from live backend API',
  };
};

/**
 * Get detailed change request by ID from live backend
 * Endpoint: GET /api/change-requests/:id
 */
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

/**
 * Submit a new change request to the backend
 * Sends POST /api/change-requests
 */
export const createChangeRequest = async (
  payload: Partial<ChangeRequest> & { title: string }
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error('Validation Error: Change request title must be at least 3 characters.');
  }

  const backendPayload = {
    summary: payload.title.trim(),
    changeType: payload.type || 'Normal',
    status: 'Active',
    ciTag: payload.linkedCiId || '',
    relatedService: payload.linkedCiName || '',
    agent: payload.agentName || '',
    startDate: payload.scheduledStart ? new Date(payload.scheduledStart).toISOString() : new Date().toISOString(),
    endDate: payload.scheduledEnd ? new Date(payload.scheduledEnd).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
    description: payload.description || '',
  };

  const res = await api.post('/api/change-requests', backendPayload);
  const created = res?.data || res;
  return {
    success: true,
    data: normalizeChangeRequest(created || payload),
    message: 'Submitted to backend',
  };
};

/**
 * Update the status of an existing change request on backend
 * Sends PATCH /api/change-requests/:id
 */
export const updateChangeRequestStatus = async (
  id: string,
  status: ChangeStatus
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  if (!id) {
    throw new Error('Validation Error: Change request ID is required.');
  }

  const res = await api.patch(`/api/change-requests/${encodeURIComponent(id)}`, {
    status: status === 'Completed' ? 'Completed' : 'Active',
  });

  const updated = res?.data || res;
  return {
    success: true,
    data: normalizeChangeRequest(updated || { id, status }),
    message: 'Updated on backend',
  };
};

/**
 * Toggle completion of a subtask within a change request
 * Sends PATCH /api/change-requests/:id
 */
export const toggleSubtaskCompletion = async (
  changeRequestId: string,
  subtaskId: string
): Promise<ChangeRequestsApiResponse<ChangeRequest>> => {
  // Fetch current from backend
  const currentRes = await fetchChangeRequestById(changeRequestId);
  const currentCR = currentRes.data;

  const updatedSubtasks = currentCR.subtasks.map((st) =>
    st.id === subtaskId ? { ...st, completed: !st.completed } : st
  );

  const completedCount = updatedSubtasks.filter((st) => st.completed).length;
  const totalCount = updatedSubtasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const res = await api.patch(`/api/change-requests/${encodeURIComponent(changeRequestId)}`, {
    subtasks: updatedSubtasks,
    completionPercent,
  });

  const updated = res?.data || res;
  return {
    success: true,
    data: normalizeChangeRequest({
      ...currentCR,
      subtasks: updatedSubtasks,
      completionPercent,
      ...(updated && typeof updated === 'object' ? updated : {}),
    }),
    message: 'Subtask toggled on backend',
  };
};
