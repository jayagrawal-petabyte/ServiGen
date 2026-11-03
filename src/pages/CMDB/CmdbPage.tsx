import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ConfigurationItem, CiType, CiLifecycleState, GroupedConfigurationItems } from '../../types/cmdb';
import {
  fetchConfigurationItems,
  fetchConfigurationItemsGroupedByType,
  groupCisByType,
} from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
import { CiDetailModal } from './CiDetailModal';
import { CreateCiModal } from './CreateCiModal';
import {
  Server,
  Database,
  Network,
  Shield,
  Cloud,
  HardDrive,
  MapPin,
  User,
  RefreshCw,
  Layers,
  LayoutGrid,
  AlertCircle,
  Plus,
  Search,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

export const DEFAULT_CONFIGURATION_ITEMS: ConfigurationItem[] = [
  {
    id: 'CI-1001',
    name: 'Primary PostgreSQL Database Cluster',
    type: 'Database',
    tag: 'DB-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Data Platform',
    technicalContact: 'David Miller',
    environment: 'Production',
    activeIncidentsCount: 1,
    linkedChangesCount: 2,
    ipAddress: '10.240.12.15',
    lastUpdated: 'Today at 09:30',
    criticality: 'Tier 1 - Mission Critical',
    specifications: {
      os: 'Ubuntu Linux 22.04 LTS',
      cpu: '32 vCPU',
      ram: '128 GB ECC',
      storage: '2 TB NVMe RAID 10',
      ipAddress: '10.240.12.15',
      macAddress: '00:1A:2B:3C:4D:5E',
      model: 'Dell PowerEdge R750',
      rackLocation: 'Rack B-14, U18-U20',
    },
    relationships: [
      {
        type: 'runs_on',
        targetCiId: 'CI-1002',
        targetCiName: 'Payment Gateway App Server',
        targetCiTag: 'PAY-001',
        direction: 'upstream',
      },
      {
        type: 'backed_up_by',
        targetCiId: 'CI-1007',
        targetCiName: 'SAN Backup Storage Vault',
        targetCiTag: 'SAN-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [
      {
        name: 'PostgreSQL Enterprise Support (EDB)',
        licenseKeyMasked: 'EDB-PROD-****-9821',
        expiryDate: 'Dec 31, 2027',
        seatsTotal: 1,
        seatsAllocated: 1,
      },
    ],
  },
  {
    id: 'CI-1002',
    name: 'Payment Gateway Application Server',
    type: 'Server',
    tag: 'PAY-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Finance & Payments',
    technicalContact: 'Sarah Jenkins',
    environment: 'Production',
    activeIncidentsCount: 2,
    linkedChangesCount: 1,
    ipAddress: '10.240.14.88',
    lastUpdated: '18/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    specifications: {
      os: 'Red Hat Enterprise Linux 9.2',
      cpu: '16 vCPU',
      ram: '64 GB',
      storage: '500 GB SSD',
      ipAddress: '10.240.14.88',
      macAddress: '00:1B:3C:4D:5E:6F',
      model: 'HP ProLiant DL380 Gen10',
      rackLocation: 'Rack B-14, U22-U24',
    },
    relationships: [
      {
        type: 'depends_on',
        targetCiId: 'CI-1001',
        targetCiName: 'Primary PostgreSQL Database Cluster',
        targetCiTag: 'DB-001',
        direction: 'downstream',
      },
      {
        type: 'connected_to',
        targetCiId: 'CI-1004',
        targetCiName: 'Core Cisco Switch Rack 4',
        targetCiTag: 'NET-001',
        direction: 'downstream',
      },
    ],
    softwareLicenses: [
      {
        name: 'Red Hat Enterprise Linux Server',
        licenseKeyMasked: 'RHEL-9-****-4432',
        expiryDate: 'Nov 15, 2026',
        seatsTotal: 4,
        seatsAllocated: 2,
      },
    ],
  },
  {
    id: 'CI-1003',
    name: 'Cloudflare Edge CDN & WAF Gateway',
    type: 'Cloud Service',
    tag: 'CDN-001',
    site: 'Global Edge Anycast',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Platform Infrastructure',
    technicalContact: 'Alex Agent',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 1,
    ipAddress: '104.16.24.0/24',
    lastUpdated: '20/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    specifications: {
      os: 'Cloudflare Serverless V8',
      ipAddress: '104.16.24.0/24',
      model: 'Cloudflare Enterprise Edge Plan',
    },
    relationships: [
      {
        type: 'connected_to',
        targetCiId: 'CI-1002',
        targetCiName: 'Payment Gateway App Server',
        targetCiTag: 'PAY-001',
        direction: 'downstream',
      },
    ],
  },
  {
    id: 'CI-1004',
    name: 'Core Cisco Switch Rack 4 (London DC)',
    type: 'Network',
    tag: 'NET-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Network Operations',
    technicalContact: 'Carlos Ray',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 2,
    ipAddress: '10.240.0.1',
    lastUpdated: '21/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    specifications: {
      os: 'Cisco NX-OS 10.3',
      cpu: 'Dual Core Supervisor',
      ram: '32 GB',
      ipAddress: '10.240.0.1',
      model: 'Cisco Nexus 9300-EX',
      rackLocation: 'Rack B-14, U01-U02',
    },
    relationships: [],
  },
  {
    id: 'CI-1005',
    name: 'Corporate Identity Provider (Okta / SSO)',
    type: 'Security',
    tag: 'SEC-001',
    site: 'Cloud / Multi-Region',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'InfoSec & Compliance',
    technicalContact: 'Adam Admin',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    lastUpdated: '19/10/2026',
    criticality: 'Tier 1 - Mission Critical',
    specifications: {
      os: 'SaaS Multi-Tenant Cloud',
      model: 'Okta Adaptive MFA + Workforce Identity',
    },
    relationships: [],
  },
  {
    id: 'CI-1006',
    name: 'Customer Portal Frontend Web Service',
    type: 'Application',
    tag: 'APP-001',
    site: 'London Primary DC (Lon-01)',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Customer Experience',
    technicalContact: 'Linda Chen',
    environment: 'Production',
    activeIncidentsCount: 1,
    linkedChangesCount: 1,
    ipAddress: '10.240.15.22',
    lastUpdated: '22/10/2026',
    criticality: 'Tier 2 - Business Operational',
    specifications: {
      os: 'Node.js 20 Alpine Linux Container',
      cpu: '8 vCPU',
      ram: '16 GB',
      ipAddress: '10.240.15.22',
    },
    relationships: [
      {
        type: 'depends_on',
        targetCiId: 'CI-1001',
        targetCiName: 'Primary PostgreSQL Database Cluster',
        targetCiTag: 'DB-001',
        direction: 'downstream',
      },
    ],
  },
  {
    id: 'CI-1007',
    name: 'SAN Backup Storage Vault (Immutable)',
    type: 'Server',
    tag: 'SAN-001',
    site: 'Frankfurt Disaster Recovery Site',
    status: 'Active',
    lifecycleState: 'Deployed',
    businessOwner: 'Infrastructure & Storage',
    technicalContact: 'Backup Team',
    environment: 'Production',
    activeIncidentsCount: 0,
    linkedChangesCount: 0,
    ipAddress: '10.242.8.50',
    lastUpdated: '15/10/2026',
    criticality: 'Tier 2 - Business Operational',
    specifications: {
      os: 'NetApp ONTAP 9.12',
      storage: '120 TB WORM Immutable Volume',
      ipAddress: '10.242.8.50',
      model: 'NetApp FAS8300',
    },
    relationships: [],
  },
  {
    id: 'CI-1008',
    name: 'Redis In-Memory Session Cache',
    type: 'Database',
    tag: 'DB-002',
    site: 'London Primary DC (Lon-01)',
    status: 'Maintenance',
    lifecycleState: 'Maintenance',
    businessOwner: 'Data Platform',
    technicalContact: 'David Miller',
    environment: 'Staging',
    activeIncidentsCount: 0,
    linkedChangesCount: 1,
    ipAddress: '10.240.12.99',
    lastUpdated: 'Today at 08:00',
    criticality: 'Tier 3 - Supporting',
    specifications: {
      os: 'Redis Enterprise 7.2',
      ram: '32 GB In-Memory',
      ipAddress: '10.240.12.99',
    },
    relationships: [],
  },
];

interface CmdbPageProps {
  configurationItems?: ConfigurationItem[];
  searchQuery?: string;
}

export const CmdbPage: React.FC<CmdbPageProps> = ({
  configurationItems: initialItems,
  searchQuery: externalSearch = '',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';

  const [items, setItems] = useState<ConfigurationItem[]>(initialItems || DEFAULT_CONFIGURATION_ITEMS);
  const [groupedItems, setGroupedItems] = useState<GroupedConfigurationItems | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'all' | 'grouped'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearch || querySearch);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedCiForModal, setSelectedCiForModal] = useState<ConfigurationItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (viewGrouping === 'grouped') {
        const res = await fetchConfigurationItemsGroupedByType();
        setGroupedItems(res.data);
        const flat = Object.values(res.data).flat();
        if (flat.length > 0) {
          setItems(flat);
        } else {
          setItems(DEFAULT_CONFIGURATION_ITEMS);
          setGroupedItems(groupCisByType(DEFAULT_CONFIGURATION_ITEMS));
        }
      } else {
        const res = await fetchConfigurationItems();
        if (res.data && res.data.length > 0) {
          setItems(res.data);
          setGroupedItems(groupCisByType(res.data));
        } else {
          setItems(DEFAULT_CONFIGURATION_ITEMS);
          setGroupedItems(groupCisByType(DEFAULT_CONFIGURATION_ITEMS));
        }
      }
    } catch (err: any) {
      console.warn('[CmdbPage] Fallback to enterprise CI seed:', err);
      setItems(DEFAULT_CONFIGURATION_ITEMS);
      setGroupedItems(groupCisByType(DEFAULT_CONFIGURATION_ITEMS));
    } finally {
      setIsLoading(false);
    }
  }, [viewGrouping]);

  useEffect(() => {
    if (!initialItems) {
      loadData();
    } else {
      setItems(initialItems);
      setGroupedItems(groupCisByType(initialItems));
    }
  }, [initialItems, loadData]);

  // Filter items
  const filteredCis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((ci: ConfigurationItem) => {
      const matchesSearch =
        !q ||
        ci.name.toLowerCase().includes(q) ||
        ci.id.toLowerCase().includes(q) ||
        ci.tag.toLowerCase().includes(q) ||
        ci.site.toLowerCase().includes(q) ||
        ci.businessOwner.toLowerCase().includes(q) ||
        (ci.ipAddress && ci.ipAddress.toLowerCase().includes(q));

      const matchesType = selectedType === 'ALL' || ci.type === selectedType;
      const matchesStatus = selectedStatus === 'ALL' || ci.status === selectedStatus;
      const matchesLifecycle = selectedLifecycle === 'ALL' || ci.lifecycleState === selectedLifecycle;

      return matchesSearch && matchesType && matchesStatus && matchesLifecycle;
    });
  }, [items, searchQuery, selectedType, selectedStatus, selectedLifecycle]);

  const handleRegisterCi = (newCi: ConfigurationItem) => {
    setItems((prev) => [newCi, ...prev]);
    if (groupedItems) {
      setGroupedItems(groupCisByType([newCi, ...items]));
    }
  };

  const getCiIcon = (type: CiType | string) => {
    switch (type) {
      case 'Database':
        return <Database className="w-5 h-5 text-indigo-500" />;
      case 'Network':
        return <Network className="w-5 h-5 text-emerald-500" />;
      case 'Cloud Service':
        return <Cloud className="w-5 h-5 text-sky-500" />;
      case 'Security':
        return <Shield className="w-5 h-5 text-rose-500" />;
      case 'Server':
        return <HardDrive className="w-5 h-5 text-amber-500" />;
      default:
        return <Server className="w-5 h-5 text-slate-500" />;
    }
  };

  const renderCiCard = (ci: ConfigurationItem) => (
    <div
      key={ci.id}
      onClick={() => setSelectedCiForModal(ci)}
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#eb6a47]/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
      title="Click to view full specifications, topology & dependencies"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
              {getCiIcon(ci.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-extrabold text-[#eb6a47] tracking-wide block">
                  {ci.tag}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                  {ci.lifecycleState || 'Deployed'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">
                {ci.name}
              </h3>
            </div>
          </div>
          <StatusBadge label={ci.status} variant={getCiStatusVariant(ci.status)} />
        </div>

        <div className="grid grid-cols-2 gap-2 my-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ci.site}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ci.businessOwner}</span>
          </div>
          <div className="col-span-2 text-slate-400 text-[10px] pt-1 border-t border-slate-200/60 flex justify-between font-mono">
            <span>Env: {ci.environment}</span>
            <span>IP: {ci.ipAddress || ci.specifications?.ipAddress || 'DHCP'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!ci.activeIncidentsCount}
            onClick={() =>
              navigate(`/incidents?ci=${encodeURIComponent(ci.id)}&ciName=${encodeURIComponent(ci.name)}`)
            }
            title={
              ci.activeIncidentsCount
                ? `View ${ci.activeIncidentsCount} incident(s) for ${ci.name}`
                : `No active incidents for ${ci.name}`
            }
            className="px-2 py-0.5 bg-amber-50 enabled:hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px] enabled:cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
          >
            Incidents: {ci.activeIncidentsCount ?? 0}
            {ci.activeIncidentsCount ? ' →' : ''}
          </button>
          <button
            type="button"
            disabled={!ci.linkedChangesCount}
            onClick={() =>
              navigate(`/change-requests?ci=${encodeURIComponent(ci.id)}&ciName=${encodeURIComponent(ci.name)}`)
            }
            title={
              ci.linkedChangesCount
                ? `View ${ci.linkedChangesCount} change request(s) for ${ci.name}`
                : `No linked change requests for ${ci.name}`
            }
            className="px-2 py-0.5 bg-purple-50 enabled:hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold text-[10px] enabled:cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
          >
            Changes: {ci.linkedChangesCount ?? 0}
            {ci.linkedChangesCount ? ' →' : ''}
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          {ci.lastUpdated}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#faf6f2] select-none">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-slate-800 bg-transparent border-none cursor-pointer p-0"
          >
            Service Desk
          </button>
          <span>/</span>
          <span className="text-gray-900">CMDB &amp; Asset Management</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Header & Sub-navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configuration Management Database (CMDB)
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Enterprise CI registry, hardware specifications, topology dependencies, and ITIL lifecycle tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Main Module Tabs (Configuration Items vs Live Service Health) */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => navigate('/cmdb')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#eb6a47] text-white shadow-2xs cursor-pointer transition-all"
              >
                Configuration Items (CIs)
              </button>
              <button
                type="button"
                onClick={() => navigate('/cmdb/services')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer transition-all"
              >
                Service CIs (Live Health)
              </button>
            </div>

            {/* View switcher between All and Grouped */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewGrouping('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewGrouping === 'all'
                    ? 'bg-[#1c2b3d] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View flat card grid of all CIs"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> All CIs
              </button>
              <button
                type="button"
                onClick={() => setViewGrouping('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewGrouping === 'grouped'
                    ? 'bg-[#1c2b3d] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View CIs grouped by architectural type"
              >
                <Layers className="w-3.5 h-3.5" /> Grouped by Type
              </button>
            </div>

            {/* Add CI Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register CI</span>
            </button>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => loadData()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Refresh from backend API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#eb6a47]' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filters Strip */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search by name, tag, owner, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
            >
              <option value="ALL">All Types</option>
              <option value="Server">Servers</option>
              <option value="Database">Databases</option>
              <option value="Network">Network Devices</option>
              <option value="Cloud Service">Cloud Services</option>
              <option value="Security">Security Assets</option>
              <option value="Application">Applications</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Deprecated">Deprecated</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Lifecycle:</span>
            <select
              value={selectedLifecycle}
              onChange={(e) => setSelectedLifecycle(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
            >
              <option value="ALL">All Lifecycles</option>
              <option value="Deployed">Deployed</option>
              <option value="In Stock">In Stock</option>
              <option value="Ordered">Ordered</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-semibold flex items-center gap-2">
            {isLoading && <span className="text-[#eb6a47] font-bold">Synchronizing...</span>}
            <span>Showing {filteredCis.length} {filteredCis.length === 1 ? 'CI' : 'CIs'}</span>
          </div>
        </div>

        {/* Grid or Grouped Content */}
        {viewGrouping === 'grouped' && groupedItems ? (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([typeCategory, categoryCis]) => {
              if (selectedType !== 'ALL' && selectedType !== typeCategory) {
                return null;
              }

              const visibleCis = categoryCis.filter((ci) => {
                const matchesSearch =
                  ci.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ci.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ci.tag.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = selectedStatus === 'ALL' || ci.status === selectedStatus;
                const matchesLifecycle = selectedLifecycle === 'ALL' || ci.lifecycleState === selectedLifecycle;
                return matchesSearch && matchesStatus && matchesLifecycle;
              });

              if (visibleCis.length === 0) return null;

              return (
                <div key={typeCategory} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      {getCiIcon(typeCategory)}
                      <h2 className="text-lg font-bold text-slate-800">{typeCategory}</h2>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                        {visibleCis.length} {visibleCis.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleCis.map((ci) => renderCiCard(ci))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCis.map((ci: ConfigurationItem) => renderCiCard(ci))}

            {filteredCis.length === 0 && !isLoading && (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <Server className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-600">No Configuration Items Match Current Filter</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try clearing search terms or selecting 'All Types'
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CI Detail Modal */}
      {selectedCiForModal && (
        <CiDetailModal
          ci={selectedCiForModal}
          onClose={() => setSelectedCiForModal(null)}
          onOpenCreateChange={(ci) => {
            setSelectedCiForModal(null);
            navigate(`/change-requests?openCreate=true&ciId=${encodeURIComponent(ci.tag)}&ciName=${encodeURIComponent(ci.name)}`);
          }}
        />
      )}

      {/* Register CI Modal */}
      {isCreateModalOpen && (
        <CreateCiModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleRegisterCi}
        />
      )}
    </div>
  );
};

export default CmdbPage;
