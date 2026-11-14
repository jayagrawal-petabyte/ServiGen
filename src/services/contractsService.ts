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

export const contractsService = {
  async getContracts(filters?: ContractFilters): Promise<ContractItem[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.contractType && filters.contractType !== 'All') params.append('contractType', filters.contractType);
    if (filters?.expiringSoonDays) params.append('expiringSoonDays', String(filters.expiringSoonDays));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/api/contracts${qs}`);
    const raw = res?.data || res;
    return Array.isArray(raw) ? raw : raw?.data || [];
  },

  async getContractById(id: string): Promise<ContractItem | null> {
    const res = await api.get(`/api/contracts/${id}`);
    const raw = res?.data || res;
    return raw?.data || raw || null;
  },

  async getExpiringSoon(days: number = 60): Promise<ContractItem[]> {
    const res = await api.get(`/api/contracts/expiring-soon?days=${days}`);
    const raw = res?.data || res;
    return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  },

  async createContract(data: Partial<ContractItem>): Promise<ContractItem> {
    const res = await api.post('/api/contracts', data);
    const raw = res?.data || res;
    return raw?.data || raw;
  },

  async updateContract(id: string, patch: Partial<ContractItem>): Promise<ContractItem> {
    const res = await api.patch(`/api/contracts/${id}`, patch);
    const raw = res?.data || res;
    return raw?.data || raw;
  },

  async deleteContract(id: string): Promise<boolean> {
    await api.delete(`/api/contracts/${id}`);
    return true;
  },
};
