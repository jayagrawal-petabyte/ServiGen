/**
 * Article Drafts API Service
 * 
 * NOTE REGARDING BACKEND INTEGRATION:
 * The ServiGen API Documentation (Version 1.0, October 2026) and the current backend repository
 * (origin/Backend) do NOT include routes, controllers, or database models for Article Drafts or Knowledge Base.
 * 
 * To comply with project guidelines ("Do not invent routes or payloads. Keep the existing mock data isolated
 * to development/demo use if the backend is not yet available"):
 * - This service provides typed DTOs and API methods prepared for future backend endpoints.
 * - If VITE_ARTICLES_API_URL is configured in environment, it will attempt live API calls via apiClient.
 * - Otherwise, it falls back to isolated development storage with complete field validation,
 *   lifecycle status transitions, and error handling.
 */

import {
  INITIAL_ARTICLE_DRAFTS,
  type ArticleDraft,
  type ArticleDraftStatus,
} from '../mockArticleDraftsData';
import { apiClient, ApiError } from '../../../services/apiClient';

export type CreateArticleDraftDto = Omit<ArticleDraft, 'id'>;
export type UpdateArticleDraftDto = Partial<Omit<ArticleDraft, 'id'>>;

const STORAGE_KEY = 'servigen_article_drafts_isolated_v2';
const SIMULATED_LATENCY_MS = 250;

/**
 * Check if a custom backend endpoint for Article Drafts has been provided via environment.
 */
function getArticlesBackendEndpoint(): string | null {
  const custom = import.meta.env.VITE_ARTICLES_API_URL;
  if (typeof custom === 'string' && custom.trim().length > 0) {
    return custom.trim().replace(/\/+$/, '');
  }
  return null;
}

/**
 * Helper to get drafts from isolated development storage or initial seed
 */
function getStoredDrafts(): ArticleDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read article drafts from storage:', err);
  }
  return [...INITIAL_ARTICLE_DRAFTS];
}

/**
 * Helper to persist drafts to isolated development storage
 */
function setStoredDrafts(data: ArticleDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist article drafts to storage:', err);
  }
}

export const articleDraftsApi = {
  /**
   * Status check: indicates whether a verified backend endpoint is configured.
   */
  isBackendAvailable(): boolean {
    return getArticlesBackendEndpoint() !== null;
  },

  /**
   * Fetch all article drafts
   */
  async getDrafts(): Promise<ArticleDraft[]> {
    const endpoint = getArticlesBackendEndpoint();
    if (endpoint) {
      try {
        return await apiClient.get<ArticleDraft[]>(`${endpoint}`);
      } catch (err) {
        throw err;
      }
    }

    // Isolated development storage fallback
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return getStoredDrafts();
  },

  /**
   * Fetch single article draft by ID
   */
  async getDraftById(id: string): Promise<ArticleDraft> {
    if (!id) {
      throw new Error('Validation Error: Article ID is required.');
    }

    const endpoint = getArticlesBackendEndpoint();
    if (endpoint) {
      try {
        return await apiClient.get<ArticleDraft>(`${endpoint}/${encodeURIComponent(id)}`);
      } catch (err) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const list = getStoredDrafts();
    const found = list.find((d) => d.id === id);
    if (!found) {
      throw new ApiError(`Article draft #${id} not found`, 404);
    }
    return found;
  },

  /**
   * Create a new article draft with validation
   */
  async createArticleDraft(newDraft: CreateArticleDraftDto): Promise<ArticleDraft> {
    if (!newDraft.summaryTitle || newDraft.summaryTitle.trim().length < 3) {
      throw new Error('Validation Error: Article title must be at least 3 characters.');
    }
    if (newDraft.summaryTitle.trim().length > 120) {
      throw new Error('Validation Error: Article title cannot exceed 120 characters.');
    }
    if (!newDraft.body || newDraft.body.trim().length < 10) {
      throw new Error('Validation Error: Article content must be at least 10 characters.');
    }

    const endpoint = getArticlesBackendEndpoint();
    if (endpoint) {
      try {
        return await apiClient.post<ArticleDraft>(`${endpoint}`, newDraft);
      } catch (err) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    // Generate next unique 7-digit ID (e.g. 0003028)
    const numericIds = list
      .map((d) => parseInt(d.id, 10))
      .filter((n) => !isNaN(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 3027;
    const nextId = String(maxId + 1).padStart(7, '0');

    const created: ArticleDraft = {
      ...newDraft,
      id: nextId,
    };

    const nextList = [created, ...list];
    setStoredDrafts(nextList);

    return created;
  },

  /**
   * Update article draft content and metadata with validation
   */
  async updateDraftContent(
    id: string,
    updates: UpdateArticleDraftDto
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

    const endpoint = getArticlesBackendEndpoint();
    if (endpoint) {
      try {
        return await apiClient.patch<ArticleDraft>(`${endpoint}/${encodeURIComponent(id)}`, updates);
      } catch (err) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const item = list.find((d) => d.id === id);

    if (!item) {
      throw new ApiError(`Article draft #${id} not found.`, 404);
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

    const endpoint = getArticlesBackendEndpoint();
    if (endpoint) {
      try {
        return await apiClient.patch<ArticleDraft>(
          `${endpoint}/${encodeURIComponent(id)}/status`,
          { status: newStatus }
        );
      } catch (err) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const item = list.find((d) => d.id === id);

    if (!item) {
      throw new ApiError(`Article draft #${id} not found.`, 404);
    }

    // Validation: ensure draft has required content before submitting for approval
    if (newStatus === 'Awaiting Approval') {
      if (!item.summaryTitle || item.summaryTitle.trim().length < 3) {
        throw new Error(
          'Validation Error: Article must have a valid title before submitting for approval.'
        );
      }
      if (!item.body || item.body.trim().length < 10) {
        throw new Error(
          'Validation Error: Article must have draft body content before submitting for approval.'
        );
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

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

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
    await new Promise((resolve) => setTimeout(resolve, 200));
    setStoredDrafts([...INITIAL_ARTICLE_DRAFTS]);
    return [...INITIAL_ARTICLE_DRAFTS];
  },
};
