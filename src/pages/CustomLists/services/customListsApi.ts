import { apiClient, ApiError } from '../../../services/apiClient';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface CustomListFormData {
  listName: string;
  use: string;
  listGroup: string;
  sequence: number;
  showCounts: boolean;
  columnProfile: string;
  displayType: string;
  showChangeFreeze: boolean;
  showByTeam: boolean;
  haloApi: boolean;
}

export interface BackendCustomList {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  fields: string[];
  scope?: string | null;
  group?: string | null;
  sequence?: number;
  columnProfile?: string | null;
  displayType?: string | null;
  filterCriteria?: any;
  createdBy?: string;
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomListPayload {
  name: string;
  description?: string;
  fields: string[];
  status?: 'Draft' | 'Published' | 'Archived';
  scope?: string;
  group?: string;
  sequence?: number;
  columnProfile?: string;
  displayType?: string;
  filterCriteria?: {
    conditions: FilterCondition[];
    showCounts?: boolean;
    showChangeFreeze?: boolean;
    showByTeam?: boolean;
    haloApi?: boolean;
  };
}

const STORAGE_KEY = 'servigen_custom_lists_cache';

/**
 * Retrieve cached custom lists for resilient offline fallback
 */
function getCachedLists(): BackendCustomList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Update local cache
 */
function setCachedLists(lists: BackendCustomList[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // ignore
  }
}

/**
 * Fetch all custom lists from backend /api/list-builder/lists
 */
export async function fetchCustomLists(): Promise<BackendCustomList[]> {
  try {
    const response = await apiClient.get<any>('/api/list-builder/lists');
    const lists = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : null;

    if (lists) {
      setCachedLists(lists);
      return lists;
    }
    return getCachedLists();
  } catch (error) {
    console.warn('[CustomListsApi] Live backend fetch unavailable, using cached lists:', error);
    return getCachedLists();
  }
}

/**
 * Fetch a single custom list by ID from /api/list-builder/lists/:id
 */
export async function fetchCustomListById(id: string): Promise<BackendCustomList | null> {
  try {
    const response = await apiClient.get<any>(`/api/list-builder/lists/${encodeURIComponent(id)}`);
    const list = response?.data || response;
    return list || null;
  } catch (error) {
    console.warn(`[CustomListsApi] Failed to fetch list ${id} from live API:`, error);
    const cached = getCachedLists().find((l) => l.id === id);
    return cached || null;
  }
}

/**
 * Create a new custom list via POST /api/list-builder/lists
 */
export async function saveCustomList(
  formData: CustomListFormData,
  filterConditions: FilterCondition[] = []
): Promise<BackendCustomList> {
  // Determine relevant display columns based on target entity/scope
  const defaultFields =
    formData.use === 'Users'
      ? ['id', 'username', 'email', 'role', 'availability', 'organisation']
      : formData.use === 'Assets'
      ? ['id', 'name', 'type', 'site', 'status', 'businessOwner']
      : formData.use === 'Projects'
      ? ['id', 'name', 'status', 'owner', 'priority', 'dueDate']
      : ['id', 'summary', 'status', 'priority', 'ticketType', 'assignedAgent', 'createdAt'];

  const payload: CreateCustomListPayload = {
    name: formData.listName.trim(),
    description: `Custom list: ${formData.listName.trim()} (${formData.use})`,
    fields: defaultFields,
    status: 'Published',
    scope: formData.use,
    group: formData.listGroup,
    sequence: Number(formData.sequence) || 0,
    columnProfile: formData.columnProfile,
    displayType: formData.displayType,
    filterCriteria: {
      conditions: filterConditions,
      showCounts: formData.showCounts,
      showChangeFreeze: formData.showChangeFreeze,
      showByTeam: formData.showByTeam,
      haloApi: formData.haloApi,
    },
  };

  try {
    const response = await apiClient.post<any>('/api/list-builder/lists', payload);
    const created: BackendCustomList = response?.data || response;

    if (created && created.id) {
      const cached = getCachedLists();
      setCachedLists([created, ...cached.filter((item) => item.id !== created.id)]);
      return created;
    }
    throw new Error('Invalid response structure received from server');
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Fallback: If network or backend connection is temporarily unavailable in dev
    console.warn('[CustomListsApi] Network unavailable, saving to local state fallback:', err);
    const fallbackList: BackendCustomList = {
      id: `LIST-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      fields: payload.fields,
      status: 'Published',
      scope: payload.scope,
      group: payload.group,
      sequence: payload.sequence,
      columnProfile: payload.columnProfile,
      displayType: payload.displayType,
      filterCriteria: payload.filterCriteria,
      createdBy: 'Service Agent',
      createdAt: new Date().toISOString(),
    };
    const cached = getCachedLists();
    setCachedLists([fallbackList, ...cached]);
    return fallbackList;
  }
}
