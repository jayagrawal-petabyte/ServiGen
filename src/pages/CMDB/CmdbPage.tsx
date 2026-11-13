import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ConfigurationItem, CiType, GroupedConfigurationItems } from '../../types/cmdb';
import {
  fetchConfigurationItems,
  fetchConfigurationItemsGroupedByType,
  createConfigurationItem,
  updateConfigurationItem,
  fetchCiTopology,
  addCiRelationship,
  deleteCiRelationship,
  groupCisByType,
  type CiTopologyGraph,
} from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
import { CiDetailModal } from './CiDetailModal';
import { CreateCiModal } from './CreateCiModal';
import { CiVisualTopologyTree } from './CiVisualTopologyTree';
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
  GitBranch,
  ShieldCheck,
  Calendar,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface CmdbPageProps {
  configurationItems?: ConfigurationItem[];
  searchQuery?: string;
}

export function getWarrantyTag(dateStr?: string) {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  if (isNaN(expiry.getTime())) return null;
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Expired (${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`,
      shortLabel: 'Expired',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      status: 'expired' as const,
      diffDays,
    };
  }
  if (diffDays <= 90) {
    return {
      label: `Expiring: ${diffDays}d left`,
      shortLabel: `${diffDays}d left`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      status: 'warning' as const,
      diffDays,
    };
  }
  return {
    label: `Warranty: ${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
    shortLabel: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'active' as const,
    diffDays,
  };
}

export const CmdbPage: React.FC<CmdbPageProps> = ({
  configurationItems: initialItems,
  searchQuery: externalSearch = '',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';

  // Direct backend state - no mock file reliance
  const [items, setItems] = useState<ConfigurationItem[]>(initialItems || []);
  const [groupedItems, setGroupedItems] = useState<GroupedConfigurationItems | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'all' | 'grouped' | 'topology'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('ALL');
  const [selectedWarranty, setSelectedWarranty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearch || querySearch);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Topology Tree state
  const [selectedTopologyCiId, setSelectedTopologyCiId] = useState<string>('');
  const [topologyGraph, setTopologyGraph] = useState<CiTopologyGraph | null>(null);
  const [isLoadingTopology, setIsLoadingTopology] = useState<boolean>(false);

  // Modals
  const [selectedCiForModal, setSelectedCiForModal] = useState<ConfigurationItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch real data from backend API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (viewGrouping === 'grouped') {
        const res = await fetchConfigurationItemsGroupedByType();
        setGroupedItems(res.data);
        const flat = Object.values(res.data).flat();
        setItems(flat);
      } else {
        const res = await fetchConfigurationItems();
        const data = res.data || [];
        setItems(data);
        setGroupedItems(groupCisByType(data));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to CMDB backend API');
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

  // Topology Tree Root CI resolution
  const selectedTopologyRootCi = useMemo(() => {
    if (selectedTopologyCiId) {
      const found = items.find((c) => c.id === selectedTopologyCiId || c.tag === selectedTopologyCiId);
      if (found) return found;
    }
    const withRels = items.find((c) => c.relationships && c.relationships.length > 0);
    return withRels || items[0] || null;
  }, [items, selectedTopologyCiId]);

  const loadTopology = useCallback(async () => {
    if (!selectedTopologyRootCi) return;
    setIsLoadingTopology(true);
    try {
      const res = await fetchCiTopology(selectedTopologyRootCi.id);
      setTopologyGraph(res.data);
    } catch (err: any) {
      console.warn('Topology fetch notice:', err);
    } finally {
      setIsLoadingTopology(false);
    }
  }, [selectedTopologyRootCi]);

  useEffect(() => {
    if (viewGrouping === 'topology' && selectedTopologyRootCi) {
      loadTopology();
    }
  }, [viewGrouping, selectedTopologyRootCi, loadTopology]);

  // Type Counts for dynamic filter badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: items.length,
      Server: 0,
      Application: 0,
      Database: 0,
      Network: 0,
      'Cloud Service': 0,
      Security: 0,
    };
    items.forEach((item) => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });
    return counts;
  }, [items]);

  // Live filter query matching
  const filteredCis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((ci) => {
      const matchesSearch =
        !q ||
        ci.name.toLowerCase().includes(q) ||
        ci.id.toLowerCase().includes(q) ||
        ci.tag.toLowerCase().includes(q) ||
        ci.site.toLowerCase().includes(q) ||
        ci.businessOwner.toLowerCase().includes(q) ||
        (ci.ipAddress && ci.ipAddress.toLowerCase().includes(q)) ||
        (ci.specifications?.os && ci.specifications.os.toLowerCase().includes(q)) ||
        (ci.specifications?.model && ci.specifications.model.toLowerCase().includes(q));

      const matchesType = selectedType === 'ALL' || ci.type === selectedType;
      const matchesStatus = selectedStatus === 'ALL' || ci.status === selectedStatus;
      const matchesLifecycle = selectedLifecycle === 'ALL' || ci.lifecycleState === selectedLifecycle;

      let matchesWarranty = true;
      if (selectedWarranty !== 'ALL') {
        const w = getWarrantyTag(ci.warrantyExpiry || ci.specifications?.warrantyExpiry);
        if (selectedWarranty === 'expired') {
          matchesWarranty = w?.status === 'expired';
        } else if (selectedWarranty === 'warning') {
          matchesWarranty = w?.status === 'warning';
        } else if (selectedWarranty === 'active') {
          matchesWarranty = w?.status === 'active';
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesLifecycle && matchesWarranty;
    });
  }, [items, searchQuery, selectedType, selectedStatus, selectedLifecycle, selectedWarranty]);

  // CI Registration handler (calls real backend POST)
  const handleRegisterCi = async (newCi: ConfigurationItem) => {
    try {
      const res = await createConfigurationItem(newCi);
      const created = res.data;
      setItems((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
      if (groupedItems) {
        setGroupedItems((prev) =>
          prev ? groupCisByType([created, ...items.filter((i) => i.id !== created.id)]) : null
        );
      }
    } catch {
      setItems((prev) => [newCi, ...prev]);
      if (groupedItems) {
        setGroupedItems((prev) => (prev ? groupCisByType([newCi, ...items]) : null));
      }
    }
  };

  const handleUpdateCi = (updatedCi: ConfigurationItem) => {
    setItems((prev) => prev.map((item) => (item.id === updatedCi.id ? updatedCi : item)));
    setSelectedCiForModal(updatedCi);
    if (groupedItems) {
      setGroupedItems((prev) => {
        if (!prev) return null;
        const newAll = items.map((item) => (item.id === updatedCi.id ? updatedCi : item));
        return groupCisByType(newAll);
      });
    }
    if (viewGrouping === 'topology' && selectedTopologyRootCi?.id === updatedCi.id) {
      loadTopology();
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
      case 'Application':
        return <Layers className="w-5 h-5 text-violet-500" />;
      case 'Server':
        return <HardDrive className="w-5 h-5 text-amber-500" />;
      default:
        return <Server className="w-5 h-5 text-slate-500" />;
    }
  };

  const renderCiCard = (ci: ConfigurationItem) => {
    const warranty = getWarrantyTag(ci.warrantyExpiry || ci.specifications?.warrantyExpiry);

    return (
      <div
        key={ci.id}
        onClick={() => setSelectedCiForModal(ci)}
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#eb6a47]/50 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
        title="Click to view full specifications, topology and dependencies"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-orange-50/50 transition-colors">
                {getCiIcon(ci.type)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-extrabold text-[#eb6a47] tracking-wide block">
                    {ci.tag}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {ci.lifecycleState || 'Deployed'}
                  </span>
                  {warranty && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${warranty.badgeClass}`}
                    >
                      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                      {warranty.shortLabel}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5 group-hover:text-[#eb6a47] transition-colors">
                  {ci.name}
                </h3>
              </div>
            </div>
            <StatusBadge label={ci.status} variant={getCiStatusVariant(ci.status)} />
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{ci.site}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{ci.businessOwner}</span>
            </div>
            <div className="col-span-2 text-slate-400 text-[10px] pt-1.5 border-t border-slate-200/60 flex justify-between font-mono">
              <span>Env: {ci.environment}</span>
              <span>IP: {ci.ipAddress || ci.specifications?.ipAddress || 'DHCP'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {ci.type}
          </span>
          <div className="flex items-center gap-2">
            {ci.activeIncidentsCount > 0 ? (
              <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                {ci.activeIncidentsCount} {ci.activeIncidentsCount === 1 ? 'incident' : 'incidents'}
              </span>
            ) : (
              <span className="text-slate-400">0 incidents</span>
            )}
            {ci.relationships && ci.relationships.length > 0 && (
              <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {ci.relationships.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#faf6f2] select-none">
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
          <span className="text-[#eb6a47] font-extrabold">Configuration Management (CMDB)</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configuration Management Database
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live ITIL asset repository, recursive dependency topologies, and hardware warranty lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/cmdb/services')}
              className="px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#eb6a47]" />
              <span>Service CIs & SLA</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register CI</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Refresh CMDB from Backend"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search, Filter Toolbar & View Switcher */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Live Search input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tag, name, IP, site, OS..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb6a47]/50"
              />
            </div>

            {/* Quick dropdown filters */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Deprecated">Deprecated</option>
                </select>
              </div>

              {/* Lifecycle filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <span>Lifecycle:</span>
                <select
                  value={selectedLifecycle}
                  onChange={(e) => setSelectedLifecycle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Lifecycle</option>
                  <option value="Deployed">Deployed</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              {/* Warranty filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#eb6a47]" />
                <span>Warranty:</span>
                <select
                  value={selectedWarranty}
                  onChange={(e) => setSelectedWarranty(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Warranties</option>
                  <option value="active">Active Only</option>
                  <option value="warning">Expiring Soon (≤90d)</option>
                  <option value="expired">Expired Only</option>
                </select>
              </div>

              {/* View Switcher: Flat View | Category View | Dependency Tree */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewGrouping('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewGrouping === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Flat View</span>
                </button>
                <button
                  onClick={() => setViewGrouping('grouped')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewGrouping === 'grouped'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Category View</span>
                </button>
                <button
                  onClick={() => setViewGrouping('topology')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewGrouping === 'topology'
                      ? 'bg-white text-[#eb6a47] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Dependency Tree</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Type Filter Pills with Live Item Counts */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Type:
            </span>
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Assets</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'ALL' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.ALL}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Server')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Server'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Servers</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Server' ? 'bg-amber-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.Server}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Application')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Application'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Applications</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Application' ? 'bg-violet-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.Application}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Database')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Database'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Databases</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Database' ? 'bg-indigo-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.Database}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Network')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Network'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Network</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Network' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.Network}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Cloud Service')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Cloud Service'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Services</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Cloud Service' ? 'bg-sky-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts['Cloud Service']}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('Security')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedType === 'Security'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedType === 'Security' ? 'bg-rose-800 text-white' : 'bg-white text-slate-600'}`}>
                {typeCounts.Security}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: Visual Dependency Tree View */}
        {viewGrouping === 'topology' ? (
          <div className="space-y-4">
            {/* Top Root CI Selector bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-bold text-slate-600 shrink-0">Focus Configuration Item:</span>
                <select
                  value={selectedTopologyRootCi?.id || ''}
                  onChange={(e) => setSelectedTopologyCiId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                >
                  {items.map((ci) => (
                    <option key={ci.id} value={ci.id}>
                      {ci.tag} - {ci.name} ({ci.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTopologyRootCi && (
                <button
                  onClick={() => setSelectedCiForModal(selectedTopologyRootCi)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#eb6a47]" />
                  <span>Open {selectedTopologyRootCi.tag} Specifications</span>
                </button>
              )}
            </div>

            {selectedTopologyRootCi ? (
              <CiVisualTopologyTree
                rootCi={selectedTopologyRootCi}
                topologyGraph={topologyGraph}
                allCis={items}
                isLoading={isLoadingTopology}
                onRefresh={loadTopology}
                onSelectCi={(targetId) => setSelectedTopologyCiId(targetId)}
                onLinkRelationship={async (targetId, type, direction) => {
                  await addCiRelationship(selectedTopologyRootCi.id, {
                    targetId,
                    type: type as any,
                    direction,
                  });
                  loadTopology();
                  loadData();
                }}
                onUnlinkRelationship={async (targetId) => {
                  await deleteCiRelationship(selectedTopologyRootCi.id, targetId);
                  loadTopology();
                  loadData();
                }}
              />
            ) : (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                <GitBranch className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No Configuration Item available for Topology</p>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-48"
              />
            ))}
          </div>
        ) : filteredCis.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No configuration items match your filter criteria.</p>
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedStatus('ALL');
                setSelectedLifecycle('ALL');
                setSelectedWarranty('ALL');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#eb6a47] font-bold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : viewGrouping === 'grouped' && groupedItems ? (
          /* VIEW 2: Category Grouped View */
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([type, list]) => {
              const matchedCategoryItems = list.filter((ci) =>
                filteredCis.some((f) => f.id === ci.id)
              );
              if (matchedCategoryItems.length === 0) return null;

              return (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {getCiIcon(type)}
                      <span>{type}s</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({matchedCategoryItems.length})
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {matchedCategoryItems.map(renderCiCard)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW 3: Flat Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCis.map(renderCiCard)}
          </div>
        )}
      </div>

      <CiDetailModal
        ci={selectedCiForModal}
        allCis={items}
        onClose={() => setSelectedCiForModal(null)}
        onUpdateCi={handleUpdateCi}
        onOpenCreateChange={(ci) => {
          setSelectedCiForModal(null);
          navigate(`/change-requests?openCreate=true&ci=${encodeURIComponent(ci.tag || ci.name)}`);
        }}
      />

      <CreateCiModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleRegisterCi}
      />
    </div>
  );
};
