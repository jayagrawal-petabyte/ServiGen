import { apiClient, ApiError } from '../../../services/apiClient';
import type { Approval, TicketDetails } from '../ApprovalCard';
import { articleDraftsApi } from '../../ArticleDrafts/services/articleDraftsApi';
import type { ArticleDraft } from '../../ArticleDrafts/articleDrafts.types';

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

const STORAGE_KEY = 'servigen_approvals_cache_v3';
const MOCK_STORAGE_KEY = 'servigen_approvals_mock_v3';

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
      : `#${idStr}`;

  const normalizedStatus = (raw.status ? raw.status.toLowerCase() : 'pending') as
    | 'pending'
    | 'approved'
    | 'rejected';

  const ticketDetails: TicketDetails = {
    ticketId: idStr.padStart(7, '0'),
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
    onBehalfOf: 'General User',
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
 * Adapter: Convert an Article Draft awaiting approval into an Approval record.
 * Bridges Article Drafts submissions into the My Approvals queue.
 */
export function adaptArticleDraftToApproval(draft: ArticleDraft): Approval {
  const initials = draft.author
    ? draft.author
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DU';

  const ticketNumber = `#${draft.id}`;

  return {
    id: `draft-${draft.id}`,
    ticketNumber,
    authorName: draft.author || 'Demo User',
    authorInitials: initials,
    authorType: 'user',
    onBehalfOf: draft.team || 'General User',
    title: draft.summaryTitle || 'Knowledge Base Article Review',
    timeAgo: draft.date || 'Pending review',
    createdAt: new Date().toISOString(),
    description: draft.summarySubtitle
      ? `${draft.summarySubtitle}\n\n${draft.body}`
      : draft.body,
    status: 'pending',
    priority: draft.priority || 'High',
    category: draft.category || 'Knowledge Base',
    urgency: draft.priority || 'High',
    ticketDetails: {
      ticketId: draft.id.padStart(7, '0'),
      ticketType: 'Knowledge Article Draft',
      username: 'general.user',
      fullName: draft.author,
      department: draft.team || 'HR Systems Support',
      extraInfo: `SLA Time Left: ${draft.slaTimeLeft}`,
    },
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
  return [];
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
 * 
 * Also bridges submitted Article Drafts awaiting review into the approval queue.
 */
export const approvalsApi = {
  /**
   * Return any cached processed (approved / rejected) approvals from current session
   */
  getCachedHistory(): Approval[] {
    const cache = getCachedApprovals();
    return Object.values(cache);
  },

  /**
   * Fetch pending approvals from GET /api/approvals/pending merged with awaiting article drafts.
   */
  async getPendingApprovals(useMockFallback = false): Promise<Approval[]> {
    let baseApprovals: Approval[] = [];

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 100));
      baseApprovals = getMockApprovals().filter((a) => a.status === 'pending');
    } else {
      try {
        const response: any = await apiClient.get<BackendApproval[]>('/api/approvals');
        const backendItems = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        if (backendItems.length > 0) {
          baseApprovals = backendItems.map((item: any) => adaptBackendApproval(item));
        } else {
          baseApprovals = [];
        }
      } catch (err) {
        console.warn('Backend /api/approvals offline or unreachable:', err);
        baseApprovals = [];
      }
    }

    // Always fetch pending article drafts currently awaiting approval
    let draftApprovals: Approval[] = [];
    try {
      const allDrafts = await articleDraftsApi.getDrafts();
      const awaitingDrafts = allDrafts.filter((d) => d.status === 'Awaiting Approval');
      const cache = getCachedApprovals();
      draftApprovals = awaitingDrafts
        .map((d) => adaptArticleDraftToApproval(d))
        .filter((da) => {
          const cached = cache[da.id];
          return !cached || cached.status === 'pending';
        });
    } catch {
      draftApprovals = [];
    }

    // Filter out items already actioned in this session
    const cache = getCachedApprovals();
    const finalPending = [...draftApprovals, ...baseApprovals].filter((item) => {
      const cached = cache[item.id];
      return !cached || cached.status === 'pending';
    });

    return finalPending;
  },

  /**
   * Fetch approval details by ID from GET /api/approvals/:approvalId
   */
  async getApprovalById(approvalId: string, useMockFallback = false): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    // Check if this approval references an article draft
    if (approvalId.startsWith('draft-')) {
      const draftId = approvalId.replace('draft-', '');
      const draft = await articleDraftsApi.getDraftById(draftId);
      const adapted = adaptArticleDraftToApproval(draft);
      const cache = getCachedApprovals();
      if (cache[approvalId]) {
        adapted.status = cache[approvalId].status;
        adapted.rejectReason = cache[approvalId].rejectReason;
      }
      return adapted;
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 100));
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
      const raw = (response as any)?.data || response;
      const adapted = adaptBackendApproval(raw);
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      console.warn(`Backend GET /api/approvals/${approvalId} offline, checking local storage:`, err);
      const found = getMockApprovals().find((a) => a.id === approvalId);
      if (found) {
        cacheApproval(found);
        return found;
      }
      throw err;
    }
  },

  /**
   * Approve a pending request via PATCH /api/approvals/:approvalId/approve
   * If approving an article draft, updates the draft status to 'Published'.
   */
  async approveRequest(approvalId: string, useMockFallback = false): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    // Handle Article Draft approval
    if (approvalId.startsWith('draft-')) {
      const draftId = approvalId.replace('draft-', '');
      const updatedDraft = await articleDraftsApi.updateDraftStatus(draftId, 'Published');
      const approved = adaptArticleDraftToApproval(updatedDraft);
      approved.status = 'approved';
      cacheApproval(approved);
      return approved;
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 150));
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (!item) throw new ApiError(`Approval #${approvalId} not found`, 404);
      const updated: Approval = { ...item, status: 'approved' };
      setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
      cacheApproval(updated);
      return updated;
    }

    try {
      const response = await apiClient.patch<BackendApproval>(
        `/api/approvals/${encodeURIComponent(approvalId)}/approve`
      );
      const adapted = adaptBackendApproval(response);
      adapted.status = 'approved';
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      console.warn(`Backend PATCH /api/approvals/${approvalId}/approve offline/failed, updating local state:`, err);
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (item) {
        const updated: Approval = { ...item, status: 'approved' };
        setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
        cacheApproval(updated);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Reject a pending request via PATCH /api/approvals/:approvalId/reject
   * If rejecting an article draft, returns it to 'Draft' with rejection reason recorded.
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

    // Handle Article Draft rejection
    if (approvalId.startsWith('draft-')) {
      const draftId = approvalId.replace('draft-', '');
      const updatedDraft = await articleDraftsApi.updateDraftStatus(draftId, 'Draft');
      const rejected = adaptArticleDraftToApproval(updatedDraft);
      rejected.status = 'rejected';
      rejected.rejectReason = trimmedReason;
      cacheApproval(rejected);
      return rejected;
    }

    if (useMockFallback) {
      await new Promise((r) => setTimeout(r, 150));
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (!item) throw new ApiError(`Approval #${approvalId} not found`, 404);
      const updated: Approval = {
        ...item,
        status: 'rejected',
        rejectReason: trimmedReason,
      };
      setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
      cacheApproval(updated);
      return updated;
    }

    try {
      const response = await apiClient.patch<BackendApproval>(
        `/api/approvals/${encodeURIComponent(approvalId)}/reject`,
        { reason: trimmedReason }
      );
      const adapted = adaptBackendApproval(response, trimmedReason);
      adapted.status = 'rejected';
      adapted.rejectReason = trimmedReason;
      cacheApproval(adapted);
      return adapted;
    } catch (err) {
      console.warn(`Backend PATCH /api/approvals/${approvalId}/reject offline/failed, updating local state:`, err);
      const list = getMockApprovals();
      const item = list.find((a) => a.id === approvalId);
      if (item) {
        const updated: Approval = {
          ...item,
          status: 'rejected',
          rejectReason: trimmedReason,
        };
        setMockApprovals(list.map((a) => (a.id === approvalId ? updated : a)));
        cacheApproval(updated);
        return updated;
      }
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
    await new Promise((r) => setTimeout(r, 150));
    setMockApprovals([]);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },
};
