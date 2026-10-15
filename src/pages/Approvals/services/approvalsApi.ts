import { apiClient, ApiError } from '../../../services/apiClient';
import { INITIAL_APPROVALS } from '../mockApprovalsData';
import type { Approval, TicketDetails } from '../ApprovalCard';

export interface BackendApproval {
  id: string;
  title: string;
  requester: string;
  service: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  submittedAt: string;
  description: string;
  rejectReason?: string;
}

const STORAGE_KEY = 'servigen_approvals_cache_v2';
const MOCK_STORAGE_KEY = 'servigen_approvals_mock_v2';

/**
 * Helper to compute friendly relative time string from ISO date string
 */
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'recently';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'recently';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'recently';
  }
}

/**
 * Adapter: Convert Backend Approval response schema to the UI Approval model.
 * Preserves all UI design elements, ticket details, and metadata.
 */
export function adaptBackendApproval(
  backendItem: BackendApproval | Approval,
  overrideRejectReason?: string
): Approval {
  // If it already matches frontend Approval structure
  if ('ticketNumber' in backendItem && 'authorName' in backendItem) {
    const app = backendItem as Approval;
    return {
      ...app,
      rejectReason: overrideRejectReason || app.rejectReason,
    };
  }

  const raw = backendItem as BackendApproval;
  const idStr = String(raw.id || '');
  const initials = raw.requester
    ? raw.requester
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RQ';

  const ticketNumber =
    idStr.toUpperCase().startsWith('REQ') || idStr.startsWith('#')
      ? idStr
      : `REQ-${idStr.toUpperCase()}`;

  const normalizedStatus = (raw.status ? raw.status.toLowerCase() : 'pending') as
    | 'pending'
    | 'approved'
    | 'rejected';

  const ticketDetails: TicketDetails = {
    ticketId: `TCK-${idStr}`,
    ticketType: raw.service || 'Service Request',
    fullName: raw.requester || 'Requester',
    department: 'Corporate Services',
  };

  return {
    id: idStr,
    ticketNumber,
    authorName: raw.requester || 'Requester',
    authorInitials: initials,
    authorType: 'user',
    title: raw.title || 'Approval Request',
    timeAgo: formatTimeAgo(raw.submittedAt),
    createdAt: raw.submittedAt || new Date().toISOString(),
    description: raw.description || '',
    status: normalizedStatus,
    priority: 'Normal',
    category: raw.service || 'General',
    urgency: 'Normal',
    ticketDetails,
    rejectReason: overrideRejectReason || raw.rejectReason,
  };
}

/**
 * Isolated development/mock storage helper
 */
function getMockApprovals(): Approval[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [...INITIAL_APPROVALS];
}

function setMockApprovals(list: Approval[]): void {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // fallback
  }
}

/**
 * Cache helper for live API state (to keep approved/rejected status across tab switching)
 */
function getCachedApprovals(): Record<string, Approval> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function cacheApproval(approval: Approval): void {
  try {
    const cache = getCachedApprovals();
    cache[approval.id] = approval;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

/**
 * Approvals API Service
 * Integrates directly with documented ServiGen backend endpoints:
 * - GET   /api/approvals/pending
 * - GET   /api/approvals/:approvalId
 * - PATCH /api/approvals/:approvalId/approve
 * - PATCH /api/approvals/:approvalId/reject
 */
export const approvalsApi = {
  /**
   * Fetch pending approvals from GET /api/approvals/pending
   * Fallback to mock data only if mock mode is explicitly requested.
   */
  async getPendingApprovals(useMockFallback = false): Promise<Approval[]> {
    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 200));
      return getMockApprovals().filter((a) => a.status === 'pending');
    }

    try {
      const response = await apiClient.get<BackendApproval[]>('/api/approvals/pending');
      const backendItems = Array.isArray(response) ? response : [];
      const adapted = backendItems.map((item) => adaptBackendApproval(item));
      return adapted;
    } catch (err) {
      // Re-throw so caller can display exact API failure
      throw err;
    }
  },

  /**
   * Fetch approval details by ID from GET /api/approvals/:approvalId
   */
  async getApprovalById(approvalId: string, useMockFallback = false): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 150));
      const found = getMockApprovals().find((a) => a.id === approvalId);
      if (!found) {
        throw new ApiError(`Approval #${approvalId} not found`, 404);
      }
      return found;
    }

    try {
      const response = await apiClient.get<BackendApproval>(
        `/api/approvals/${encodeURIComponent(approvalId)}`
      );
      const adapted = adaptBackendApproval(response);
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Approve a pending request via PATCH /api/approvals/:approvalId/approve
   * No request body per backend specification.
   */
  async approveRequest(approvalId: string, useMockFallback = false): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 200));
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (!item) throw new ApiError(`Approval #${approvalId} not found`, 404);
      if (item.status !== 'pending') {
        throw new ApiError('Cannot update non-pending request', 400);
      }
      const updated: Approval = { ...item, status: 'approved' };
      setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
      return updated;
    }

    try {
      // Per backend implementation, PATCH /api/approvals/:approvalId/approve takes no body
      const response = await apiClient.patch<BackendApproval>(
        `/api/approvals/${encodeURIComponent(approvalId)}/approve`
      );
      const adapted = adaptBackendApproval(response);
      adapted.status = 'approved';
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Reject a pending request via PATCH /api/approvals/:approvalId/reject
   * No request body per backend specification; reason is retained in client state.
   */
  async rejectRequest(
    approvalId: string,
    reason: string,
    useMockFallback = false
  ): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    const trimmedReason = reason?.trim() || '';
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new Error('Validation Error: Rejection reason must be at least 5 characters long.');
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 200));
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (!item) throw new ApiError(`Approval #${approvalId} not found`, 404);
      if (item.status !== 'pending') {
        throw new ApiError('Cannot update non-pending request', 400);
      }
      const updated: Approval = {
        ...item,
        status: 'rejected',
        rejectReason: trimmedReason,
      };
      setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
      return updated;
    }

    try {
      // Per backend implementation, PATCH /api/approvals/:approvalId/reject takes no body
      const response = await apiClient.patch<BackendApproval>(
        `/api/approvals/${encodeURIComponent(approvalId)}/reject`
      );
      const adapted = adaptBackendApproval(response, trimmedReason);
      adapted.status = 'rejected';
      adapted.rejectReason = trimmedReason;
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Batch approve pending requests
   */
  async batchApprove(approvalIds: string[], useMockFallback = false): Promise<string[]> {
    if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    const results = await Promise.allSettled(
      approvalIds.map((id) => this.approveRequest(id, useMockFallback))
    );

    const succeeded: string[] = [];
    const errors: string[] = [];

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        succeeded.push(approvalIds[index]);
      } else {
        const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
        errors.push(`${approvalIds[index]}: ${msg}`);
      }
    });

    if (errors.length > 0 && succeeded.length === 0) {
      throw new Error(`Batch approve failed: ${errors.join(', ')}`);
    }

    return succeeded;
  },

  /**
   * Batch reject pending requests
   */
  async batchReject(
    approvalIds: string[],
    reason = 'Bulk rejection by user',
    useMockFallback = false
  ): Promise<string[]> {
    if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    const results = await Promise.allSettled(
      approvalIds.map((id) => this.rejectRequest(id, reason, useMockFallback))
    );

    const succeeded: string[] = [];
    const errors: string[] = [];

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        succeeded.push(approvalIds[index]);
      } else {
        const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
        errors.push(`${approvalIds[index]}: ${msg}`);
      }
    });

    if (errors.length > 0 && succeeded.length === 0) {
      throw new Error(`Batch reject failed: ${errors.join(', ')}`);
    }

    return succeeded;
  },

  /**
   * Reset mock data to default seed for demo mode
   */
  async resetMockData(): Promise<Approval[]> {
    await new Promise((r) => setTimeout(r, 200));
    setMockApprovals([...INITIAL_APPROVALS]);
    return [...INITIAL_APPROVALS];
  },
};
