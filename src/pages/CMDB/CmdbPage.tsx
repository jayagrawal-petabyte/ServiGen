import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ConfigurationItem, CiType, GroupedConfigurationItems } from '../../types/cmdb';
import {
  fetchConfigurationItems,
  fetchConfigurationItemsGroupedByType,
  groupCisByType,
} from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
import { CiDetailModal } from './CiDetailModal';
import { CreateCiModal } from './CreateCiModal';
import { defaultConfigurationItems } from './cmdbData';
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

  const [items, setItems] = useState<ConfigurationItem[]>(initialItems || defaultConfigurationItems);
  const [groupedItems, setGroupedItems] = useState<GroupedConfigurationItems | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'all' | 'grouped'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearch || querySearch);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          setItems(defaultConfigurationItems);
          setGroupedItems(groupCisByType(defaultConfigurationItems));
        }
      } else {
        const res = await fetchConfigurationItems();
        if (res.data && res.data.length > 0) {
          setItems(res.data);
          setGroupedItems(groupCisByType(res.data));
        } else {
          setItems(defaultConfigurationItems);
          setGroupedItems(groupCisByType(defaultConfigurationItems));
        }
      }
    } catch {
      setItems(defaultConfigurationItems);
      setGroupedItems(groupCisByType(defaultConfigurationItems));
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
      title="Click to view full specifications, topology and dependencies"
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
          {ci.linkedChangesCount > 0 && (
            <span className="text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
              {ci.linkedChangesCount} {ci.linkedChangesCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>
      </div>
    </div>
  );

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configuration Management Database
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ITIL asset repository, relationship topologies, and infrastructure inventory.
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
              title="Refresh CMDB"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tag, name, IP, site..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb6a47]/50"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="Server">Servers</option>
                <option value="Database">Databases</option>
                <option value="Network">Network</option>
                <option value="Application">Applications</option>
                <option value="Cloud Service">Cloud Services</option>
                <option value="Security">Security</option>
              </select>
            </div>

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
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto">
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
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
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
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#eb6a47] font-bold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : viewGrouping === 'grouped' && groupedItems ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCis.map(renderCiCard)}
          </div>
        )}
      </div>

      <CiDetailModal
        ci={selectedCiForModal}
        onClose={() => setSelectedCiForModal(null)}
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
