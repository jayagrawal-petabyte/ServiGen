import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConfigurationItem, CiType, GroupedConfigurationItems } from '../../types/cmdb';
import {
  fetchConfigurationItems,
  fetchConfigurationItemsGroupedByType,
  groupCisByType,
} from '../../services/cmdbService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { getCiStatusVariant } from '../../utils/statusUtils';
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
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface CmdbPageProps {
  configurationItems?: ConfigurationItem[];
  searchQuery?: string;
}

export const CmdbPage: React.FC<CmdbPageProps> = ({
  configurationItems: initialItems,
  searchQuery = '',
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ConfigurationItem[]>(initialItems || []);
  const [groupedItems, setGroupedItems] = useState<GroupedConfigurationItems | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'all' | 'grouped'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(!initialItems);
  const [error, setError] = useState<string | null>(null);

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
        setItems(res.data);
        setGroupedItems(groupCisByType(res.data));
      }
    } catch (err: any) {
      console.error('[CmdbPage] Error loading CMDB items:', err);
      setError(err?.message || 'Failed to load Configuration Items from server.');
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

  const filteredCis = items.filter((ci: ConfigurationItem) => {
    const matchesSearch =
      ci.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.businessOwner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || ci.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || ci.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

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
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
              {getCiIcon(ci.type)}
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-[#eb6a47] tracking-wide block">
                {ci.tag}
              </span>
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
          <div className="col-span-2 text-slate-400 text-[10px] pt-1 border-t border-slate-200/60 flex justify-between">
            <span>Env: {ci.environment}</span>
            <span>Tech Contact: {ci.technicalContact}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {/* Both chips used to navigate to the full, unfiltered list with no
              reference to this CI, so you lost your place and saw everything.
              They now carry the CI through in the query string, and a chip with
              nothing behind it is inert rather than a dead end. */}
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
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">CMDB</span>
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
              CMDB: Asset registry, infrastructure mapping, site locations, and technical owners
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Main Module Tabs (Configuration Items vs Live Service Health) */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl gap-1">
              <button
                onClick={() => navigate('/cmdb')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#eb6a47] text-white shadow-2xs cursor-pointer transition-all"
              >
                Configuration Items (CIs)
              </button>
              <button
                onClick={() => navigate('/cmdb/services')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer transition-all"
              >
                Service CIs (Live Health)
              </button>
            </div>

            {/* View switcher between All and Grouped */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setViewGrouping('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewGrouping === 'all'
                    ? 'bg-[#1c2b3d] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="GET /api/cmdb/configuration-items"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> All CIs
              </button>
              <button
                onClick={() => setViewGrouping('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewGrouping === 'grouped'
                    ? 'bg-[#1c2b3d] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="GET /api/cmdb/configuration-items/grouped-by-type"
              >
                <Layers className="w-3.5 h-3.5" /> Grouped by Type
              </button>
            </div>

            {/* Refresh button */}
            <button
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
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
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
              return matchesSearch && matchesStatus;
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
    </div>
  );
};
