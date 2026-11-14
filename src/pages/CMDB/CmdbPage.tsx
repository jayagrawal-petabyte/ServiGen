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
import {
  SegmentedTabs,
  RefreshButton,
  Button,
  ModuleSidebar,
  ModuleSidebarGroup,
} from '../../components/shared';

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

  // Direct backend state
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

  // Sidebar navigation state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedViewId, setSelectedViewId] = useState<string>('all-cis');

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

  const activeCount = useMemo(() => items.filter((ci) => ci.status === 'Active').length, [items]);
  const maintenanceCount = useMemo(
    () => items.filter((ci) => ci.status === 'Maintenance').length,
    [items]
  );
  const warrantyExpiringCount = useMemo(() => {
    return items.filter((ci) => {
      const w = getWarrantyTag(ci.warrantyExpiry || ci.specifications?.warrantyExpiry);
      return w?.status === 'warning';
    }).length;
  }, [items]);
  const warrantyExpiredCount = useMemo(() => {
    return items.filter((ci) => {
      const w = getWarrantyTag(ci.warrantyExpiry || ci.specifications?.warrantyExpiry);
      return w?.status === 'expired';
    }).length;
  }, [items]);

  // Sidebar navigation structure
  const rawSidebarGroups: ModuleSidebarGroup[] = useMemo(
    () => [
      {
        id: 'views',
        title: 'Repository Views',
        items: [
          {
            id: 'all-cis',
            label: 'All Configuration Items',
            icon: <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />,
            count: items.length,
          },
          {
            id: 'category-view',
            label: 'Category Breakdown',
            icon: <Layers className="w-3.5 h-3.5 text-slate-600" />,
            count: items.length,
          },
          {
            id: 'topology-tree',
            label: 'Dependency Topology',
            icon: <GitBranch className="w-3.5 h-3.5 text-slate-600" />,
          },
          {
            id: 'service-cis',
            label: 'Service CIs & SLA',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-[#C96F55]" />,
            onClick: () => navigate('/cmdb/services'),
          },
        ],
      },
      {
        id: 'ci-types',
        title: 'Configuration Types',
        items: [
          {
            id: 'type-server',
            label: 'Servers',
            icon: <HardDrive className="w-3.5 h-3.5 text-amber-500" />,
            count: typeCounts.Server,
          },
          {
            id: 'type-application',
            label: 'Applications',
            icon: <Layers className="w-3.5 h-3.5 text-violet-500" />,
            count: typeCounts.Application,
          },
          {
            id: 'type-database',
            label: 'Databases',
            icon: <Database className="w-3.5 h-3.5 text-indigo-500" />,
            count: typeCounts.Database,
          },
          {
            id: 'type-network',
            label: 'Network Devices',
            icon: <Network className="w-3.5 h-3.5 text-emerald-500" />,
            count: typeCounts.Network,
          },
          {
            id: 'type-cloud',
            label: 'Cloud Services',
            icon: <Cloud className="w-3.5 h-3.5 text-sky-500" />,
            count: typeCounts['Cloud Service'],
          },
          {
            id: 'type-security',
            label: 'Security & Firewalls',
            icon: <Shield className="w-3.5 h-3.5 text-rose-500" />,
            count: typeCounts.Security,
          },
        ],
      },
      {
        id: 'lifecycle',
        title: 'Lifecycle & Warranty',
        items: [
          {
            id: 'active',
            label: 'Active in Production',
            icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
            count: activeCount,
          },
          {
            id: 'maintenance',
            label: 'Maintenance Mode',
            icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
            count: maintenanceCount,
          },
          {
            id: 'warranty-expiring',
            label: 'Warranty Expiring (≤90d)',
            icon: <Calendar className="w-3.5 h-3.5 text-amber-600" />,
            count: warrantyExpiringCount,
          },
          {
            id: 'warranty-expired',
            label: 'Warranty Expired',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />,
            count: warrantyExpiredCount,
          },
        ],
      },
    ],
    [
      items.length,
      typeCounts,
      activeCount,
      maintenanceCount,
      warrantyExpiringCount,
      warrantyExpiredCount,
      navigate,
    ]
  );

  const handleSelectSidebarView = (viewId: string) => {
    setSelectedViewId(viewId);
    switch (viewId) {
      case 'all-cis':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'category-view':
        setViewGrouping('grouped');
        setSelectedType('ALL');
        break;
      case 'topology-tree':
        setViewGrouping('topology');
        break;
      case 'service-cis':
        navigate('/cmdb/services');
        break;
      case 'type-server':
        setViewGrouping('all');
        setSelectedType('Server');
        break;
      case 'type-application':
        setViewGrouping('all');
        setSelectedType('Application');
        break;
      case 'type-database':
        setViewGrouping('all');
        setSelectedType('Database');
        break;
      case 'type-network':
        setViewGrouping('all');
        setSelectedType('Network');
        break;
      case 'type-cloud':
        setViewGrouping('all');
        setSelectedType('Cloud Service');
        break;
      case 'type-security':
        setViewGrouping('all');
        setSelectedType('Security');
        break;
      case 'active':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('Active');
        break;
      case 'maintenance':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('Maintenance');
        break;
      case 'warranty-expiring':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedWarranty('warning');
        break;
      case 'warranty-expired':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedWarranty('expired');
        break;
      default:
        break;
    }
  };

  const currentViewLabel = useMemo(() => {
    for (const group of rawSidebarGroups) {
      const found = group.items.find((i) => i.id === selectedViewId);
      if (found) return found.label;
    }
    return 'Configuration Management Database';
  }, [selectedViewId, rawSidebarGroups]);

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
      const matchesLifecycle =
        selectedLifecycle === 'ALL' || ci.lifecycleState === selectedLifecycle;

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
        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#C96F55]/50 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
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
                  <span className="text-[11px] font-mono font-extrabold text-[#C96F55] tracking-wide block">
                    {ci.tag}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {ci.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#C96F55] transition-colors leading-snug mt-0.5 line-clamp-1">
                  {ci.name}
                </h3>
              </div>
            </div>
            <StatusBadge status={ci.status} variant={getCiStatusVariant(ci.status)} />
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 mb-3 bg-slate-50/60 rounded-xl px-3 mt-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Site / Location
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1 truncate text-[11px] mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {ci.site}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Lifecycle
              </span>
              <span className="font-semibold text-slate-700 text-[11px] mt-0.5 block truncate">
                {ci.lifecycleState || 'In Production'}
              </span>
            </div>
            {ci.ipAddress && (
              <div className="col-span-2 pt-1 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">IP: {ci.ipAddress}</span>
                {ci.specifications?.os && (
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {ci.specifications.os}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Warranty & Owner */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium truncate max-w-[120px]">
              {ci.businessOwner || 'IT Operations'}
            </span>
          </div>

          {warranty ? (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${warranty.badgeClass}`}
            >
              {warranty.label}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">No warranty info</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-[#FFF9F5] overflow-hidden font-sans select-none">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-30 min-h-[50px] sticky top-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-slate-800 bg-transparent border-none cursor-pointer p-0"
          >
            Service Desk
          </button>
          <span>/</span>
          <span className="text-gray-900 font-extrabold">Configuration Management (CMDB)</span>
        </div>
        <GlobalNavbarActions />
      </header>

      {/* ── Two-Column Layout (ModuleSidebar + Main Panel) ── */}
      <div className="flex flex-1 h-full min-h-0 w-full overflow-hidden pt-3 px-[18px] pb-6 gap-4">
        {/* Left Module Sidebar */}
        <ModuleSidebar
          title="CMDB Repository"
          icon={<Database className="w-3.5 h-3.5" />}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search CMDB assets..."
          groups={rawSidebarGroups}
          selectedId={selectedViewId}
          onSelectId={handleSelectSidebarView}
          onResetTitle={() => handleSelectSidebarView('all-cis')}
          resetTitleTooltip="Reset to All Configuration Items"
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="w-full justify-center shadow-xs"
            >
              Register CI
            </Button>
          }
        />

        {/* Right Main Panel */}
        <main className="flex-1 flex flex-col min-w-[340px] h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          {/* Main Top Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0 bg-white gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{currentViewLabel}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredCis.length} {filteredCis.length === 1 ? 'record' : 'records'})
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View Switcher: Flat / Category / Topology */}
              <SegmentedTabs<'all' | 'grouped' | 'topology'>
                variant="boxed"
                theme="navy"
                size="sm"
                tabs={[
                  { id: 'all', label: 'Flat View', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  { id: 'grouped', label: 'Category View', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'topology', label: 'Dependency Tree', icon: <GitBranch className="w-3.5 h-3.5" /> },
                ]}
                activeTab={viewGrouping}
                onChange={(view) => {
                  setViewGrouping(view);
                  if (view === 'grouped') setSelectedViewId('category-view');
                  else if (view === 'topology') setSelectedViewId('topology-tree');
                  else if (
                    selectedViewId === 'category-view' ||
                    selectedViewId === 'topology-tree'
                  )
                    setSelectedViewId('all-cis');
                }}
              />

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  if (e.target.value === 'Active') setSelectedViewId('active');
                  else if (e.target.value === 'Maintenance') setSelectedViewId('maintenance');
                  else setSelectedViewId('all-cis');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                title="Filter by Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Deprecated">Deprecated</option>
              </select>

              {/* Lifecycle filter */}
              <select
                value={selectedLifecycle}
                onChange={(e) => setSelectedLifecycle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                title="Filter by Lifecycle"
              >
                <option value="ALL">All Lifecycle</option>
                <option value="Deployed">Deployed</option>
                <option value="In Stock">In Stock</option>
                <option value="Ordered">Ordered</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>

              {/* Warranty filter */}
              <select
                value={selectedWarranty}
                onChange={(e) => {
                  setSelectedWarranty(e.target.value);
                  if (e.target.value === 'warning') setSelectedViewId('warranty-expiring');
                  else if (e.target.value === 'expired') setSelectedViewId('warranty-expired');
                  else setSelectedViewId('all-cis');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                title="Filter by Warranty"
              >
                <option value="ALL">All Warranties</option>
                <option value="active">Active Only</option>
                <option value="warning">Expiring Soon (≤90d)</option>
                <option value="expired">Expired Only</option>
              </select>

              <RefreshButton
                onClick={loadData}
                isLoading={isLoading}
                title="Refresh CMDB from Backend"
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs mb-4">
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
                    <span className="font-bold text-slate-600 shrink-0">
                      Focus Configuration Item:
                    </span>
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
                      <ExternalLink className="w-3.5 h-3.5 text-[#C96F55]" />
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
                    <p className="font-semibold text-slate-700">
                      No Configuration Item available for Topology
                    </p>
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
                <p className="text-sm font-semibold">
                  No configuration items match your filter criteria.
                </p>
                <button
                  onClick={() => {
                    handleSelectSidebarView('all-cis');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-[#C96F55] font-bold hover:underline cursor-pointer"
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
        </main>
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

export default CmdbPage;
