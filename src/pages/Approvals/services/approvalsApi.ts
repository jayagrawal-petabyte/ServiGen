import { apiClient } from '../../../services/apiClient';
import type { Approval, TicketDetails } from '../ApprovalCard';
import { articleDraftsApi } from '../../ArticleDrafts/services/articleDraftsApi';
import type { ArticleDraft } from '../../ArticleDrafts/articleDrafts.types';
import { MOCK_APPROVALS } from '../../../services/fallback/mockData';

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

export function adaptBackendApproval(
  backendItem: BackendApproval | Approval | Record<string, unknown>,
  overrideRejectReason?: string
): Approval {
  if (!backendItem) {
    return {
      id: `app-${Date.now()}`,
      ticketNumber: `#0000000`,
      authorName: 'Unknown Requester',
      authorInitials: 'UR',
      authorType: 'user',
      title: 'Approval Request',
      timeAgo: 'recently',
      createdAt: new Date().toISOString(),
      description: '',
      status: 'pending',
      priority: 'Normal',
      category: 'General',
      urgency: 'Normal',
      ticketDetails: null,
    };
  }

  const raw: any = (backendItem as any).data || backendItem;

  if ('ticketNumber' in raw && 'authorName' in raw) {
    const app = raw as Approval;
    return {
      ...app,
      rejectReason: overrideRejectReason || app.rejectReason,
    };
  }

  const idStr = String(raw.id || '');
  const initials = raw.requester
    ? raw.requester
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RQ';

  const ticketNumber =
    idStr.toUpperCase().startsWith('REQ') || idStr.startsWith('#')
      ? idStr
      : `#${idStr}`;

  const normalizedStatus = (raw.status ? String(raw.status).toLowerCase() : 'pending') as
    | 'pending'
    | 'approved'
    | 'rejected';

  const ticketDetails: TicketDetails = {
    ticketId: /^\d+$/.test(idStr) ? idStr.padStart(7, '0') : idStr,
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
    title: raw.title || raw.summary || 'Approval Request',
    timeAgo: formatTimeAgo(raw.submittedAt || raw.createdAt),
    createdAt: raw.submittedAt || raw.createdAt || new Date().toISOString(),
    description: raw.description || raw.comments || '',
    status: normalizedStatus,
    priority: 'Normal',
    category: raw.service || 'General',
    urgency: 'Normal',
    ticketDetails,
    rejectReason: overrideRejectReason || raw.rejectReason,
  };
}

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
    authorName: draft.author || 'Author',
    authorInitials: initials,
    authorType: 'user',
    onBehalfOf: draft.team || 'General User',
    title: draft.summaryTitle || 'Knowledge Base Article Review',
    timeAgo: draft.date || 'Pending review',
    createdAt: new Date().toISOString(),
    description: draft.summarySubtitle
      ? `${draft.summarySubtitle}\n\n${draft.body}`
      : draft.body,
    status: (draft.status === 'Published'
      ? 'approved'
      : draft.status === 'Rejected'
      ? 'rejected'
      : 'pending') as 'pending' | 'approved' | 'rejected',
    priority: draft.priority || 'High',
    category: draft.category || 'Knowledge Base',
    urgency: draft.priority || 'High',
    rejectReason: draft.rejectReason,
    ticketDetails: {
      ticketId: /^\d+$/.test(draft.id) ? draft.id.padStart(7, '0') : draft.id,
      ticketType: 'Knowledge Article Draft',
      username: 'general.user',
      fullName: draft.author,
      department: draft.team || 'HR Systems Support',
      extraInfo: `SLA Time Left: ${draft.slaTimeLeft}`,
    },
  };
}

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
  }
}

export const approvalsApi = {
  getCachedHistory(): Approval[] {
    const cache = getCachedApprovals();
    return Object.values(cache);
  },

  async getPendingApprovals(): Promise<Approval[]> {
    let baseApprovals: Approval[] = [];

    try {
      const response: any = await apiClient.get<any>('/api/approvals/pending');
      const backendItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      if (backendItems.length > 0) {
        baseApprovals = backendItems.map((item: any) => adaptBackendApproval(item));
      } else {
        baseApprovals = MOCK_APPROVALS.map((item: any) => adaptBackendApproval(item));
      }
    } catch (err) {
      console.warn('Backend /api/approvals/pending offline or unreachable:', err);
      baseApprovals = MOCK_APPROVALS.map((item: any) => adaptBackendApproval(item));
    }

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

    const cache = getCachedApprovals();
    const finalPending = [...draftApprovals, ...baseApprovals].filter((item) => {
      const cached = cache[item.id];
      return !cached || cached.status === 'pending';
    });

    return finalPending;
  },

  async getAllApprovals(): Promise<Approval[]> {
    const pending = await this.getPendingApprovals();
    const history = this.getCachedHistory();

    const mergedMap = new Map<string, Approval>();
    history.forEach((h) => mergedMap.set(h.id, h));
    pending.forEach((p) => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  },

  async getApprovalById(approvalId: string): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

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

    try {
      const response = await apiClient.get<any>(
        `/api/approvals/${encodeURIComponent(approvalId)}`
      );
      const raw = (response as any)?.data || response;
      const adapted = adaptBackendApproval(raw);
      cacheApproval(adapted);
      return adapted;
    } catch {
      const cache = getCachedApprovals();
      if (cache[approvalId]) {
        return cache[approvalId];
      }
      const mock = MOCK_APPROVALS.find((m) => m.id === approvalId);
      if (mock) {
        return adaptBackendApproval(mock);
      }
      throw new Error(`Approval ${approvalId} not found`);
    }
  },

  async approveRequest(approvalId: string): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    if (approvalId.startsWith('draft-')) {
      const draftId = approvalId.replace('draft-', '');
      const updatedDraft = await articleDraftsApi.updateDraftStatus(draftId, 'Published');
      const approved = adaptArticleDraftToApproval(updatedDraft);
      approved.status = 'approved';
      cacheApproval(approved);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return approved;
    }

    try {
      const response: any = await apiClient.patch<any>(
        `/api/approvals/${encodeURIComponent(approvalId)}/approve`
      );
      const raw = response?.data || response;
      const adapted = adaptBackendApproval(raw);
      adapted.status = 'approved';
      cacheApproval(adapted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return adapted;
    } catch {
      const mock = MOCK_APPROVALS.find((m) => m.id === approvalId);
      const adapted = mock
        ? adaptBackendApproval(mock)
        : {
            id: approvalId,
            ticketNumber: approvalId.startsWith('APP-') ? `#${approvalId}` : `#0001402`,
            authorName: 'Alex Rivera',
            authorInitials: 'AR',
            authorType: 'user' as const,
            title: 'Emergency Change Request',
            timeAgo: 'recently',
            createdAt: new Date().toISOString(),
            description: 'Approval request',
            status: 'approved' as const,
            priority: 'Normal',
            category: 'General',
            urgency: 'Normal',
            ticketDetails: null,
          };
      adapted.status = 'approved';
      cacheApproval(adapted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return adapted;
    }
  },

  async rejectRequest(
    approvalId: string,
    reason: string
  ): Promise<Approval> {
    if (!approvalId) {
      throw new Error('Validation Error: approvalId is required');
    }

    const trimmedReason = reason?.trim() || '';
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new Error('Validation Error: Rejection reason must be at least 5 characters long.');
    }

    if (approvalId.startsWith('draft-')) {
      const draftId = approvalId.replace('draft-', '');
      const updatedDraft = await articleDraftsApi.updateDraftStatus(draftId, 'Rejected', trimmedReason);
      const rejected = adaptArticleDraftToApproval(updatedDraft);
      rejected.status = 'rejected';
      rejected.rejectReason = trimmedReason;
      cacheApproval(rejected);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return rejected;
    }

    try {
      const response: any = await apiClient.patch<any>(
        `/api/approvals/${encodeURIComponent(approvalId)}/reject`,
        { reason: trimmedReason }
      );
      const raw = response?.data || response;
      const adapted = adaptBackendApproval(raw, trimmedReason);
      adapted.status = 'rejected';
      adapted.rejectReason = trimmedReason;
      cacheApproval(adapted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return adapted;
    } catch {
      const mock = MOCK_APPROVALS.find((m) => m.id === approvalId);
      const rejected = mock
        ? adaptBackendApproval(mock, trimmedReason)
        : {
            id: approvalId,
            ticketNumber: approvalId.startsWith('APP-') ? `#${approvalId}` : `#0001402`,
            authorName: 'Alex Rivera',
            authorInitials: 'AR',
            authorType: 'user' as const,
            title: 'Emergency Change Request',
            timeAgo: 'recently',
            createdAt: new Date().toISOString(),
            description: 'Approval request',
            status: 'rejected' as const,
            priority: 'Normal',
            category: 'General',
            urgency: 'Normal',
            ticketDetails: null,
            rejectReason: trimmedReason,
          };
      rejected.status = 'rejected';
      rejected.rejectReason = trimmedReason;
      cacheApproval(rejected);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
      }
      return rejected;
    }
  },

  async batchApprove(approvalIds: string[]): Promise<string[]> {
    if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    const results = await Promise.allSettled(
      approvalIds.map((id) => this.approveRequest(id))
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
    }

    return succeeded;
  },

  async batchReject(
    approvalIds: string[],
    reason: string
  ): Promise<string[]> {
    if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    const results = await Promise.allSettled(
      approvalIds.map((id) => this.rejectRequest(id, reason))
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servigen-approvals-updated'));
    }

    return succeeded;
  },

  resetCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};
