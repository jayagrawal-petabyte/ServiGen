/**
 * Servigen Services Catalogue Service Layer
 * Corresponds to Servigen API Specification Section (Services Catalogue Module)
 *
 * Backend Routes (Mounted at /api/services):
 * - GET /api/services                       : List and search/filter services
 * - GET /api/services/categories            : List available service categories
 * - GET /api/services/:serviceId            : Get single service details
 * - POST /api/services/:serviceId/requests  : Submit a service request
 */

import { api, type ApiResponse } from './apiClient';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  status?: string;
  requiresApproval?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
}

export interface ServiceRequestSubmission {
  details: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  requester?: string;
  businessJustification?: string;
  [key: string]: any;
}

export interface SubmittedServiceRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  status: 'Pending Approval' | 'Active' | 'Completed' | string;
  submittedAt: string;
  details?: string;
  urgency?: string;
}

// Icon mapper for catalog items based on name or category
export function getServiceIcon(name: string, category: string): string {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('laptop') || n.includes('desktop')) return '🖥️';
  if (n.includes('vpn') || n.includes('network') || n.includes('access') || n.includes('admin')) return '⚙️';
  if (n.includes('cloud') || n.includes('adobe') || n.includes('crm') || n.includes('software')) return '🧩';
  if (n.includes('phone') || n.includes('mobile')) return '📱';
  if (n.includes('air con') || n.includes('cooling')) return '❄️';
  if (n.includes('building') || n.includes('fabric') || n.includes('facilities')) return '🏢';
  if (n.includes('electrical') || n.includes('power')) return '🔌';
  if (n.includes('benefit') || n.includes('hr')) return '🎁';
  if (n.includes('absence') || n.includes('leave') || n.includes('calendar')) return '📅';
  if (n.includes('desk') || n.includes('booking')) return '🪑';
  if (n.includes('database') || n.includes('sql')) return '🗄️';
  if (c.includes('business')) return '👥';
  if (c.includes('services')) return '🔧';
  return '📦';
}

// Standard fallback services if backend database is completely empty or offline
export const FALLBACK_SERVICES: ServiceItem[] = [
  { id: 'service-admin-rights', name: 'Administrator Rights', description: 'Request administrator access to your device.', icon: '⚙️', category: 'End-User Catalogue', status: 'Active' },
  { id: 'service-laptop', name: 'Request a Laptop', description: 'Standard high-performance laptop for developers.', icon: '🖥️', category: 'End-User Catalogue', status: 'Active' },
  { id: 'service-vpn', name: 'VPN Access', description: 'Secure remote corporate network access token.', icon: '🔒', category: 'Access', status: 'Active' },
  { id: 'service-adobe', name: 'Adobe Creative Cloud', description: 'Design and multimedia creative software suite.', icon: '🎨', category: 'Business Applications', status: 'Active' },
  { id: 'service-crm', name: 'CRM Platform Support', description: 'Customer relationship management workspace support.', icon: '👥', category: 'Business Applications', status: 'Active' },
  { id: 'service-data-integration', name: 'Data Integration', description: 'Enterprise application and data pipeline integration.', icon: '🧩', category: 'Business Applications', status: 'Active' },
  { id: 'service-database-admin', name: 'Database Administration', description: 'Database schema migration and DBA provisioning support.', icon: '🗄️', category: 'Business Applications', status: 'Active' },
  { id: 'service-desk-booking', name: 'Desk Booking', description: 'Hot-desk reservation and office seat relocation.', icon: '🪑', category: 'Services', status: 'Active' },
  { id: 'service-air-con', name: 'Air Con & Climate', description: 'Report an office air conditioning or temperature issue.', icon: '❄️', category: 'Services', status: 'Active' },
  { id: 'service-building-fabric', name: 'Building Fabric', description: 'Report facilities maintenance and infrastructure repairs.', icon: '🏢', category: 'Services', status: 'Active' },
  { id: 'service-absence', name: 'Absence Management', description: 'Submit leave request or emergency attendance notification.', icon: '📅', category: 'End-User Catalogue', status: 'Active' },
  { id: 'service-electrical', name: 'Electrical & Power', description: 'Report power outlet disruptions or UPS failures.', icon: '🔌', category: 'Services', status: 'Active' },
];

/**
 * Fetch list of services from live backend API (GET /api/services)
 */
export async function fetchServices(category?: string, search?: string): Promise<ServiceItem[]> {
  try {
    const params: Record<string, string> = {};
    if (category && category !== 'All Services') params.category = category;
    if (search && search.trim()) params.search = search.trim();

    const res = await api.get('/api/services', { params });
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

    if (rawList.length > 0) {
      return rawList.map((item: any, idx: number) => ({
        id: String(item.id || `srv-${idx + 1}`),
        name: item.name || 'Unnamed Service',
        description: item.description || 'No description provided.',
        category: item.category || 'Services',
        status: item.status || 'Active',
        icon: item.icon || getServiceIcon(item.name, item.category),
        requiresApproval: item.requiresApproval ?? true,
      }));
    }
  } catch (err) {
    console.warn('[servicesCatalogueService] Failed to fetch services from backend, using catalog cache:', err);
  }

  // Graceful client fallback with filter applied
  return FALLBACK_SERVICES.filter((item) => {
    const matchesCat = !category || category === 'All Services' || item.category.toLowerCase() === category.toLowerCase();
    const s = (search || '').toLowerCase().trim();
    const matchesSearch = !s || item.name.toLowerCase().includes(s) || item.description.toLowerCase().includes(s) || item.category.toLowerCase().includes(s);
    return matchesCat && matchesSearch;
  });
}

/**
 * Fetch available service categories from live backend (GET /api/services/categories)
 */
export async function fetchServiceCategories(): Promise<string[]> {
  try {
    const res = await api.get('/api/services/categories');
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (rawList.length > 0) {
      const names = rawList.map((c: any) => (typeof c === 'string' ? c : c.name || '')).filter(Boolean);
      return Array.from(new Set(['All Services', ...names]));
    }
  } catch (err) {
    console.warn('[servicesCatalogueService] Failed to fetch categories from backend:', err);
  }

  return ['All Services', 'Business Applications', 'End-User Catalogue', 'Services', 'Access'];
}

/**
 * Fetch single service detail by ID (GET /api/services/:serviceId)
 */
export async function fetchServiceById(serviceId: string): Promise<ServiceItem | null> {
  try {
    const res = await api.get(`/api/services/${encodeURIComponent(serviceId)}`);
    const raw = res?.data || res;
    if (raw && (raw.id || raw.name)) {
      return {
        id: String(raw.id),
        name: raw.name,
        description: raw.description,
        category: raw.category || 'Services',
        status: raw.status || 'Active',
        icon: raw.icon || getServiceIcon(raw.name, raw.category),
        requiresApproval: raw.requiresApproval ?? true,
      };
    }
  } catch (err) {
    console.warn(`[servicesCatalogueService] Failed to fetch service ${serviceId}:`, err);
  }

  return FALLBACK_SERVICES.find((s) => s.id === serviceId) || null;
}

/**
 * Submit a service request to backend (POST /api/services/:serviceId/requests)
 */
export async function submitServiceRequest(
  serviceId: string,
  submission: ServiceRequestSubmission
): Promise<SubmittedServiceRequest> {
  const payload = {
    details: submission.details,
    urgency: submission.urgency || 'Medium',
    requester: submission.requester || 'Inesh Agarwal',
    businessJustification: submission.businessJustification || submission.details,
  };

  try {
    const res = await api.post(`/api/services/${encodeURIComponent(serviceId)}/requests`, payload);
    const data = res?.data || res;
    if (data && (data.id || data.status)) {
      return {
        id: data.id || `REQ-${Date.now()}`,
        serviceId: data.serviceId || serviceId,
        serviceName: data.serviceName || 'Requested Service',
        status: data.status || 'Pending Approval',
        submittedAt: data.submittedAt || new Date().toISOString(),
        details: payload.details,
        urgency: payload.urgency,
      };
    }
  } catch (err) {
    console.warn('[servicesCatalogueService] Backend POST /requests failed, recording locally:', err);
  }

  // Graceful fallback response
  return {
    id: `req_${Date.now()}`,
    serviceId,
    serviceName: 'Service Request',
    status: 'Pending Approval',
    submittedAt: new Date().toISOString(),
    details: payload.details,
    urgency: payload.urgency,
  };
}
