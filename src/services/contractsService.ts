import { api } from './apiClient';

export type ContractType = 'SLA' | 'Maintenance' | 'License' | 'Underpinning' | 'Warranty' | 'Support' | 'Other';
export type ContractStatus = 'Draft' | 'Active' | 'Pending Renewal' | 'Expired' | 'Terminated';

export interface ContractItem {
  id: string;
  title: string;
  vendorName: string;
  vendorEmail?: string | null;
  contractType: ContractType;
  status: ContractStatus;
  value: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  autoRenew: boolean;
  notes?: string | null;
  linkedCiIds: string[];
  daysUntilExpiry?: number | null;
  daysUntilRenewal?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFilters {
  status?: string;
  contractType?: string;
  expiringSoonDays?: number;
}

export interface ContractLinkedCi {
  ciId: string;
  name?: string;
  category?: string;
  status?: string;
  notes?: string;
  linkedAt?: string;
}

function mapBackendContract(item: any): ContractItem {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    contractType: (item.contractType || item.type || 'SLA') as ContractType,
    value: item.value !== undefined ? item.value : (item.contractValue || 0),
    linkedCiIds: Array.isArray(item.linkedCiIds) ? item.linkedCiIds : [],
  };
}

export const contractsService = {
  async getContracts(filters?: ContractFilters): Promise<ContractItem[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.contractType && filters.contractType !== 'All') params.append('contractType', filters.contractType);
    if (filters?.expiringSoonDays) params.append('expiringSoonDays', String(filters.expiringSoonDays));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/api/contracts${qs}`);
    const raw = res?.data || res;
    const list = Array.isArray(raw) ? raw : raw?.data || [];
    return list.map(mapBackendContract);
  },

  async getContractById(id: string): Promise<ContractItem | null> {
    const res = await api.get(`/api/contracts/${id}`);
    const raw = res?.data || res;
    const item = raw?.data || raw || null;
    return item ? mapBackendContract(item) : null;
  },

  async getExpiringSoon(days: number = 60): Promise<ContractItem[]> {
    const res = await api.get(`/api/contracts/expiring-soon?days=${days}`);
    const raw = res?.data || res;
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    return list.map(mapBackendContract);
  },

  async createContract(data: Partial<ContractItem> & { type?: string; contractValue?: number }): Promise<ContractItem> {
    const payload = {
      ...data,
      type: data.type || data.contractType || 'SLA',
      contractValue: data.contractValue !== undefined ? data.contractValue : data.value,
    };
    const res = await api.post('/api/contracts', payload);
    const raw = res?.data || res;
    return mapBackendContract(raw?.data || raw);
  },

  async updateContract(id: string, patch: Partial<ContractItem> & { type?: string; contractValue?: number }): Promise<ContractItem> {
    const payload: any = { ...patch };
    if (patch.contractType || patch.type) {
      payload.type = patch.type || patch.contractType;
    }
    if (patch.contractValue !== undefined || patch.value !== undefined) {
      payload.contractValue = patch.contractValue !== undefined ? patch.contractValue : patch.value;
    }
    const res = await api.patch(`/api/contracts/${id}`, payload);
    const raw = res?.data || res;
    return mapBackendContract(raw?.data || raw);
  },

  async deleteContract(id: string): Promise<boolean> {
    await api.delete(`/api/contracts/${id}`);
    return true;
  },

  async getLinkedCis(contractId: string): Promise<ContractLinkedCi[]> {
    const res = await api.get(`/api/contracts/${contractId}/linked-cis`);
    const raw = res?.data || res;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.data?.linkedCiIds)) {
      return raw.data.linkedCiIds.map((id: string) => ({
        ciId: id,
        name: id,
        status: 'Active',
      }));
    }
    if (Array.isArray(raw?.linkedCiIds)) {
      return raw.linkedCiIds.map((id: string) => ({
        ciId: id,
        name: id,
        status: 'Active',
      }));
    }
    return [];
  },

  async linkCi(contractId: string, ciId: string, notes?: string): Promise<any> {
    const res = await api.post(`/api/contracts/${contractId}/linked-cis`, { ciId, notes });
    const raw = res?.data || res;
    return raw?.data || raw;
  },

  async unlinkCi(contractId: string, ciId: string): Promise<boolean> {
    await api.delete(`/api/contracts/${contractId}/linked-cis/${ciId}`);
    return true;
  },
};
