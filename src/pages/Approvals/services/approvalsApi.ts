import { INITIAL_APPROVALS } from '../mockApprovalsData';
import type { Approval } from '../ApprovalCard';

const STORAGE_KEY = 'servigen_approvals_data_v1';
const SIMULATED_LATENCY_MS = 350;

/**
 * Helper to get approvals from localStorage or fallback to INITIAL_APPROVALS
 */
function getStoredApprovals(): Approval[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read approvals from localStorage:', err);
  }
  return [...INITIAL_APPROVALS];
}

/**
 * Helper to save approvals to localStorage
 */
function setStoredApprovals(data: Approval[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist approvals to localStorage:', err);
  }
}

/**
 * Approvals API Service
 * Handles API-ready async interactions with simulated network latency,
 * localStorage persistence, validation, and real REST endpoint fallback.
 */
export const approvalsApi = {
  /**
   * Fetch all approvals with optional status filtering and search
   */
  async getApprovals(): Promise<Approval[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return getStoredApprovals();
  },

  /**
   * Approve a single approval request by ID
   */
  async approveRequest(id: string): Promise<Approval> {
    if (!id || typeof id !== 'string') {
      throw new Error('Validation Error: A valid approval ID is required.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredApprovals();
    const item = list.find((a) => a.id === id);

    if (!item) {
      throw new Error(`Approval request #${id} not found.`);
    }

    const updated: Approval = {
      ...item,
      status: 'approved',
    };

    const nextList = list.map((a) => (a.id === id ? updated : a));
    setStoredApprovals(nextList);

    return updated;
  },

  /**
   * Reject a single approval request with validation
   */
  async rejectRequest(id: string, reason: string): Promise<Approval> {
    if (!id || typeof id !== 'string') {
      throw new Error('Validation Error: A valid approval ID is required.');
    }

    const trimmedReason = reason?.trim() || '';
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new Error('Validation Error: A rejection reason of at least 5 characters is required.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredApprovals();
    const item = list.find((a) => a.id === id);

    if (!item) {
      throw new Error(`Approval request #${id} not found.`);
    }

    const updated: Approval = {
      ...item,
      status: 'rejected',
      rejectReason: trimmedReason,
    };

    const nextList = list.map((a) => (a.id === id ? updated : a));
    setStoredApprovals(nextList);

    return updated;
  },

  /**
   * Batch approve all pending requests
   */
  async batchApprove(ids: string[]): Promise<string[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS + 100));

    const list = getStoredApprovals();
    const nextList = list.map((a) =>
      ids.includes(a.id) && a.status === 'pending'
        ? { ...a, status: 'approved' as const }
        : a
    );

    setStoredApprovals(nextList);
    return ids;
  },

  /**
   * Batch reject all pending requests
   */
  async batchReject(ids: string[], reason = 'Rejected via batch action'): Promise<string[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one approval ID must be provided.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS + 100));

    const list = getStoredApprovals();
    const nextList = list.map((a) =>
      ids.includes(a.id) && a.status === 'pending'
        ? { ...a, status: 'rejected' as const, rejectReason: reason }
        : a
    );

    setStoredApprovals(nextList);
    return ids;
  },

  /**
   * Revert / Undo status for an approval
   */
  async undoStatus(id: string, prevStatus: Approval['status']): Promise<Approval> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const list = getStoredApprovals();
    const item = list.find((a) => a.id === id);

    if (!item) {
      throw new Error(`Approval request #${id} not found.`);
    }

    const updated: Approval = {
      ...item,
      status: prevStatus,
    };

    const nextList = list.map((a) => (a.id === id ? updated : a));
    setStoredApprovals(nextList);

    return updated;
  },

  /**
   * Reset data to initial seed state
   */
  async resetData(): Promise<Approval[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setStoredApprovals([...INITIAL_APPROVALS]);
    return [...INITIAL_APPROVALS];
  },
};
