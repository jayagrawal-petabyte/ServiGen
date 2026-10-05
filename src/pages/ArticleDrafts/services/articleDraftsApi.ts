import {
  INITIAL_ARTICLE_DRAFTS,
  type ArticleDraft,
  type ArticleDraftStatus,
} from '../mockArticleDraftsData';

const STORAGE_KEY = 'servigen_article_drafts_data_v1';
const SIMULATED_LATENCY_MS = 350;

/**
 * Helper to get drafts from localStorage or fallback to initial seed
 */
function getStoredDrafts(): ArticleDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read article drafts from localStorage:', err);
  }
  return [...INITIAL_ARTICLE_DRAFTS];
}

/**
 * Helper to persist drafts to localStorage
 */
function setStoredDrafts(data: ArticleDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist article drafts to localStorage:', err);
  }
}

/**
 * Article Drafts API Service
 * Handles API interactions, input validation, status workflow rules,
 * and persistent storage.
 */
export const articleDraftsApi = {
  /**
   * Fetch all article drafts
   */
  async getDrafts(): Promise<ArticleDraft[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return getStoredDrafts();
  },

  /**
   * Update article draft content with validation
   */
  async updateDraftContent(
    id: string,
    updates: { summaryTitle?: string; body?: string; summarySubtitle?: string }
  ): Promise<ArticleDraft> {
    if (!id) {
      throw new Error('Validation Error: Article ID is required.');
    }

    if (updates.summaryTitle !== undefined) {
      const trimmedTitle = updates.summaryTitle.trim();
      if (!trimmedTitle || trimmedTitle.length < 3) {
        throw new Error('Validation Error: Article title must be at least 3 characters.');
      }
      if (trimmedTitle.length > 120) {
        throw new Error('Validation Error: Article title cannot exceed 120 characters.');
      }
    }

    if (updates.body !== undefined) {
      const trimmedBody = updates.body.trim();
      if (!trimmedBody || trimmedBody.length < 10) {
        throw new Error('Validation Error: Article draft content must be at least 10 characters.');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const item = list.find((d) => d.id === id);

    if (!item) {
      throw new Error(`Article draft #${id} not found.`);
    }

    const updated: ArticleDraft = {
      ...item,
      ...updates,
      summaryTitle: updates.summaryTitle ? updates.summaryTitle.trim() : item.summaryTitle,
      body: updates.body ? updates.body.trim() : item.body,
    };

    const nextList = list.map((d) => (d.id === id ? updated : d));
    setStoredDrafts(nextList);

    return updated;
  },

  /**
   * Transition article draft lifecycle status with workflow validation
   */
  async updateDraftStatus(id: string, newStatus: ArticleDraftStatus): Promise<ArticleDraft> {
    if (!id) {
      throw new Error('Validation Error: Article ID is required.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const item = list.find((d) => d.id === id);

    if (!item) {
      throw new Error(`Article draft #${id} not found.`);
    }

    // Validation: ensure draft has required content before submitting for approval
    if (newStatus === 'Awaiting Approval') {
      if (!item.summaryTitle || item.summaryTitle.trim().length < 3) {
        throw new Error('Validation Error: Article must have a valid title before submitting for approval.');
      }
      if (!item.body || item.body.trim().length < 10) {
        throw new Error('Validation Error: Article must have draft body content before submitting for approval.');
      }
    }

    const updated: ArticleDraft = {
      ...item,
      status: newStatus,
    };

    const nextList = list.map((d) => (d.id === id ? updated : d));
    setStoredDrafts(nextList);

    return updated;
  },

  /**
   * Batch update draft statuses (e.g. submit multiple drafts for approval)
   */
  async batchUpdateStatus(ids: string[], newStatus: ArticleDraftStatus): Promise<string[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one article draft ID must be provided.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS + 100));

    const list = getStoredDrafts();
    const nextList = list.map((d) =>
      ids.includes(d.id) ? { ...d, status: newStatus } : d
    );

    setStoredDrafts(nextList);
    return ids;
  },

  /**
   * Batch delete drafts
   */
  async batchDelete(ids: string[]): Promise<string[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one article draft ID must be provided.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const nextList = list.filter((d) => !ids.includes(d.id));

    setStoredDrafts(nextList);
    return ids;
  },

  /**
   * Reset data to initial mock seed
   */
  async resetData(): Promise<ArticleDraft[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setStoredDrafts([...INITIAL_ARTICLE_DRAFTS]);
    return [...INITIAL_ARTICLE_DRAFTS];
  },
};
