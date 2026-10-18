/**
 * Article Drafts API Service
 * 
 * Integrates directly with the ServiGen Backend Knowledge Articles endpoints:
 * - GET    /api/articles
 * - GET    /api/articles/:id
 * - POST   /api/articles
 * - PATCH  /api/articles/:id
 * 
 * Provides typed DTOs and seamless fallback to persistent isolated storage
 * when operating in offline/demo environments, with complete lifecycle
 * status synchronization into My Approvals.
 */

import {
  type ArticleDraft,
  type ArticleDraftStatus,
  type ArticleDraftSlaStatus,
  type CreateArticleDraftDto,
  type UpdateArticleDraftDto,
  type BackendKnowledgeArticle,
} from '../articleDrafts.types';
import { apiClient, ApiError } from '../../../services/apiClient';

export type { CreateArticleDraftDto, UpdateArticleDraftDto, BackendKnowledgeArticle };

const STORAGE_KEY = 'servigen_article_drafts_v3';
const SIMULATED_LATENCY_MS = 150;

/**
 * Check if custom or default backend articles endpoint is available
 */
function getArticlesBackendEndpoint(): string {
  const custom = import.meta.env.VITE_ARTICLES_API_URL;
  if (typeof custom === 'string' && custom.trim().length > 0) {
    return custom.trim().replace(/\/+$/, '');
  }
  return '/api/articles';
}

/**
 * Helper to adapt a Backend Knowledge Article to the UI ArticleDraft model
 */
function adaptBackendArticle(item: BackendKnowledgeArticle): ArticleDraft {
  const idStr = String(item.id).padStart(7, '0');
  
  // Calculate relative SLA status if slaDueAt exists
  let slaTimeLeft = '3d 6h left';
  let slaStatus: ArticleDraftSlaStatus = 'safe';
  if (item.slaDueAt) {
    const diff = new Date(item.slaDueAt).getTime() - Date.now();
    if (diff <= 0) {
      slaTimeLeft = 'Overdue SLA';
      slaStatus = 'overdue';
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) {
        slaTimeLeft = `${hours}h left`;
        slaStatus = 'warning';
      } else {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        slaTimeLeft = `${days}d ${remHours}h left`;
        slaStatus = days < 2 ? 'warning' : 'safe';
      }
    }
  }

  const priorityColor =
    item.priority === 'High' ? '#c2593f' : item.priority === 'Medium' ? '#e07a5f' : '#ca8a04';

  return {
    id: idStr,
    slaTimeLeft,
    slaStatus,
    summaryTitle: item.title,
    summarySubtitle: item.content ? item.content.slice(0, 70).replace(/^[#\s]+/, '') : '',
    category: item.category || 'General',
    priority: item.priority || 'High',
    priorityColor,
    status: item.status || 'Draft',
    type: 'Article Draft',
    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : '17-07-2026',
    author: item.author || 'Demo User',
    team: 'Tier 2 Messaging Ops',
    agent: item.author || 'Demo User',
    body: item.content || '',
  };
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
  return [];
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
   * Fetch all article drafts from backend /api/articles with fallback to local store
   */
  async getDrafts(): Promise<ArticleDraft[]> {
    const endpoint = getArticlesBackendEndpoint();
    try {
      const response: any = await apiClient.get<BackendKnowledgeArticle[]>(endpoint);
      const rawList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      if (rawList.length > 0) {
        const adapted = rawList.map(adaptBackendArticle);
        setStoredDrafts(adapted);
        return adapted;
      }
    } catch {
      // Backend offline or route unpopulated, fall through to local storage
    }

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
    try {
      const response = await apiClient.get<BackendKnowledgeArticle>(`${endpoint}/${encodeURIComponent(id)}`);
      if (response && response.id) {
        return adaptBackendArticle(response);
      }
    } catch {
      // Fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
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
    try {
      const response = await apiClient.post<BackendKnowledgeArticle>(endpoint, {
        title: newDraft.summaryTitle,
        content: newDraft.body,
        category: newDraft.category,
        priority: newDraft.priority,
        status: newDraft.status || 'Draft',
      });
      if (response && response.id) {
        const created = adaptBackendArticle(response);
        const list = getStoredDrafts();
        setStoredDrafts([created, ...list]);
        return created;
      }
    } catch {
      // Fallback to local store
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const numericIds = list
      .map((d) => parseInt(d.id, 10))
      .filter((n) => !isNaN(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 3027;
    const nextId = String(maxId + 1).padStart(7, '0');

    const created: ArticleDraft = {
      ...newDraft,
      id: nextId,
    };

    setStoredDrafts([created, ...list]);
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
    try {
      await apiClient.patch<BackendKnowledgeArticle>(`${endpoint}/${encodeURIComponent(id)}`, {
        title: updates.summaryTitle,
        content: updates.body,
        category: updates.category,
        priority: updates.priority,
      });
    } catch {
      // Fallback
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

    setStoredDrafts(list.map((d) => (d.id === id ? updated : d)));
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
    try {
      await apiClient.patch<BackendKnowledgeArticle>(`${endpoint}/${encodeURIComponent(id)}`, {
        status: newStatus,
      });
    } catch {
      // Fallback
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const item = list.find((d) => d.id === id);

    if (!item) {
      throw new ApiError(`Article draft #${id} not found.`, 404);
    }

    if (newStatus === 'Awaiting Approval') {
      if (!item.summaryTitle || item.summaryTitle.trim().length < 3) {
        throw new Error('Validation Error: Cannot submit draft without a valid title (minimum 3 characters).');
      }
      if (!item.body || item.body.trim().length < 10) {
        throw new Error('Validation Error: Cannot submit draft without complete content (minimum 10 characters).');
      }
    }

    const updated: ArticleDraft = {
      ...item,
      status: newStatus,
    };

    setStoredDrafts(list.map((d) => (d.id === id ? updated : d)));
    return updated;
  },

  /**
   * Batch update status
   */
  async batchUpdateStatus(ids: string[], newStatus: ArticleDraftStatus): Promise<ArticleDraft[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one ID must be provided.');
    }

    const results = await Promise.all(
      ids.map((id) => this.updateDraftStatus(id, newStatus))
    );
    return results;
  },

  /**
   * Batch delete drafts
   */
  async batchDelete(ids: string[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Validation Error: At least one ID must be provided for deletion.');
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

    const list = getStoredDrafts();
    const nextList = list.filter((item) => !ids.includes(item.id));
    setStoredDrafts(nextList);
  },

  /**
   * Reset data to default seed
   */
  async resetData(): Promise<ArticleDraft[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    setStoredDrafts([]);
    return [];
  },
};
