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
  servigenApi: boolean;
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
    servigenApi?: boolean;
  };
}

const STORAGE_KEY = 'servigen_custom_lists_cache';

function getCachedLists(): BackendCustomList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
  }
  return [];
}

function setCachedLists(lists: BackendCustomList[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
  }
}

export const DEFAULT_CUSTOM_LISTS: BackendCustomList[] = [
  {
    id: 'LIST-001',
    name: 'All Active VIP Incidents',
    description: 'High and Critical incidents affecting executive leadership',
    status: 'Published',
    fields: ['id', 'summary', 'priority', 'status', 'assignedAgent'],
    scope: 'Tickets',
    group: 'Executive Escalations',
    sequence: 1,
    columnProfile: 'Standard Support View',
    displayType: 'Grid View',
  },
  {
    id: 'LIST-002',
    name: 'Expiring Hardware Warranties (Q4)',
    description: 'Datacenter switches and server blades with warranties expiring in next 90 days',
    status: 'Published',
    fields: ['id', 'name', 'type', 'site', 'status', 'businessOwner'],
    scope: 'Assets',
    group: 'Asset Lifecycle',
    sequence: 2,
    columnProfile: 'Asset Audit View',
    displayType: 'Detailed Grid',
  },
  {
    id: 'LIST-003',
    name: 'Pending CAB Change Requests',
    description: 'Normal and Emergency changes awaiting change advisory board signoff',
    status: 'Published',
    fields: ['id', 'title', 'type', 'risk', 'cab', 'status'],
    scope: 'Changes',
    group: 'Change Management',
    sequence: 3,
    columnProfile: 'CAB Review View',
    displayType: 'Kanban View',
  },
];

export async function fetchCustomLists(): Promise<BackendCustomList[]> {
  try {
    const response = await apiClient.get<any>('/api/list-builder/lists');
    const lists = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : null;

    if (lists && lists.length > 0) {
      setCachedLists(lists);
      return lists;
    }
    const cached = getCachedLists();
    return cached.length > 0 ? cached : DEFAULT_CUSTOM_LISTS;
  } catch (error) {
    console.warn('[CustomListsApi] Live backend fetch unavailable, using cached lists:', error);
    const cached = getCachedLists();
    return cached.length > 0 ? cached : DEFAULT_CUSTOM_LISTS;
  }
}

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

export async function saveCustomList(
  formData: CustomListFormData,
  filterConditions: FilterCondition[] = []
): Promise<BackendCustomList> {
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
      servigenApi: formData.servigenApi,
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
