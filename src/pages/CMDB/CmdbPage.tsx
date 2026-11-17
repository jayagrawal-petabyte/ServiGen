import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import type { ConfigurationItem, CiType, GroupedConfigurationItems } from '../../types/cmdb';
import {
  fetchConfigurationItems,
  fetchConfigurationItemsGroupedByType,
  fetchConfigurationItemById,
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
import { ServiceCisView } from './ServiceCisView';
import {
  Server,
  Database,
  Network,
  Shield,
  Cloud,
  HardDrive,
  MapPin,
  User,
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
  Clock,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import {
  RefreshButton,
  Button,
  ModuleSidebar,
  ModuleSidebarGroup,
} from '../../components/shared';

interface CmdbPageProps {
  configurationItems?: ConfigurationItem[];
  searchQuery?: string;
  initialView?: 'all' | 'grouped' | 'topology' | 'services';
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
  initialView,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';

  const isServiceRoute = location.pathname.startsWith('/cmdb/services') || searchParams.get('view') === 'services';
  const resolvedDefaultView = initialView || (isServiceRoute ? 'services' : 'all');
  const resolvedDefaultViewId = resolvedDefaultView === 'services' ? 'service-cis' : 'all-cis';

  const [items, setItems] = useState<ConfigurationItem[]>(initialItems || []);
  const [groupedItems, setGroupedItems] = useState<GroupedConfigurationItems | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'all' | 'grouped' | 'topology' | 'services'>(resolvedDefaultView);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('ALL');
  const [selectedWarranty, setSelectedWarranty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearch || querySearch);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedViewId, setSelectedViewId] = useState<string>(resolvedDefaultViewId);

  const [selectedTopologyCiId, setSelectedTopologyCiId] = useState<string>('');
  const [topologyGraph, setTopologyGraph] = useState<CiTopologyGraph | null>(null);
  const [isLoadingTopology, setIsLoadingTopology] = useState<boolean>(false);

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

  useEffect(() => {
    const ciParam = searchParams.get('ci') || searchParams.get('id');
    if (!ciParam) return;

    if (items.length > 0) {
      const found = items.find(
        (c) =>
          c.id === ciParam ||
          c.tag?.toLowerCase() === ciParam.toLowerCase() ||
          c.name?.toLowerCase() === ciParam.toLowerCase()
      );
      if (found) {
        setSelectedCiForModal(found);
        return;
      }
    }

    fetchConfigurationItemById(ciParam)
      .then((res) => {
        if (res.data) {
          setSelectedCiForModal(res.data);
        }
      })
      .catch(() => {});
  }, [searchParams, items]);

  const handleCloseCiModal = () => {
    setSelectedCiForModal(null);
    if (searchParams.get('ci') || searchParams.get('id')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ci');
      newParams.delete('id');
      navigate({ search: newParams.toString() ? `?${newParams.toString()}` : '' }, { replace: true });
    }
  };

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
      const lookupKey = selectedTopologyRootCi.tag || selectedTopologyRootCi.id;
      const res = await fetchCiTopology(lookupKey);
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

  const statusActiveCount = useMemo(() => items.filter((ci) => ci.status === 'Active').length, [items]);
  const statusMaintenanceCount = useMemo(
    () => items.filter((ci) => ci.status === 'Maintenance').length,
    [items]
  );
  const statusDeprecatedCount = useMemo(
    () => items.filter((ci) => ci.status === 'Deprecated').length,
    [items]
  );

  const lifecycleDeployedCount = useMemo(
    () => items.filter((ci) => ci.lifecycleState === 'Deployed' || (!ci.lifecycleState && ci.status === 'Active')).length,
    [items]
  );
  const lifecycleInStockCount = useMemo(
    () => items.filter((ci) => ci.lifecycleState === 'In Stock').length,
    [items]
  );
  const lifecycleOrderedCount = useMemo(
    () => items.filter((ci) => ci.lifecycleState === 'Ordered').length,
    [items]
  );
  const lifecycleMaintenanceCount = useMemo(
    () => items.filter((ci) => ci.lifecycleState === 'Maintenance').length,
    [items]
  );
  const lifecycleRetiredCount = useMemo(
    () => items.filter((ci) => ci.lifecycleState === 'Retired').length,
    [items]
  );

  const warrantyActiveCount = useMemo(() => {
    return items.filter((ci) => {
      const w = getWarrantyTag(ci.warrantyExpiry || ci.specifications?.warrantyExpiry);
      return w?.status === 'active';
    }).length;
  }, [items]);
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

  const rawSidebarGroups: ModuleSidebarGroup[] = useMemo(
    () => [
      {
        id: 'views',
        title: 'Repository Views',
        items: [
          {
            id: 'all-cis',
            label: 'Flat View',
            icon: <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />,
            count: items.length,
          },
          {
            id: 'category-view',
            label: 'Category View',
            icon: <Layers className="w-3.5 h-3.5 text-slate-600" />,
            count: items.length,
          },
          {
            id: 'topology-tree',
            label: 'Dependency Tree',
            icon: <GitBranch className="w-3.5 h-3.5 text-slate-600" />,
          },
          {
            id: 'service-cis',
            label: 'Service CIs & SLA',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-[#C96F55]" />,
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
        id: 'ci-statuses',
        title: 'Operational Status',
        items: [
          {
            id: 'status-active',
            label: 'Active',
            icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
            count: statusActiveCount,
          },
          {
            id: 'status-maintenance',
            label: 'Maintenance',
            icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
            count: statusMaintenanceCount,
          },
          {
            id: 'status-deprecated',
            label: 'Deprecated',
            icon: <Shield className="w-3.5 h-3.5 text-slate-400" />,
            count: statusDeprecatedCount,
          },
        ],
      },
      {
        id: 'ci-lifecycle',
        title: 'Lifecycle State',
        items: [
          {
            id: 'lifecycle-deployed',
            label: 'Deployed',
            icon: <Check className="w-3.5 h-3.5 text-teal-600" />,
            count: lifecycleDeployedCount,
          },
          {
            id: 'lifecycle-in-stock',
            label: 'In Stock',
            icon: <Server className="w-3.5 h-3.5 text-blue-500" />,
            count: lifecycleInStockCount,
          },
          {
            id: 'lifecycle-ordered',
            label: 'Ordered',
            icon: <Clock className="w-3.5 h-3.5 text-indigo-500" />,
            count: lifecycleOrderedCount,
          },
          {
            id: 'lifecycle-maintenance',
            label: 'Under Maintenance',
            icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
            count: lifecycleMaintenanceCount,
          },
          {
            id: 'lifecycle-retired',
            label: 'Retired',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />,
            count: lifecycleRetiredCount,
          },
        ],
      },
      {
        id: 'ci-warranty',
        title: 'Warranty Health',
        items: [
          {
            id: 'warranty-active',
            label: 'Active Warranty',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
            count: warrantyActiveCount,
          },
          {
            id: 'warranty-expiring',
            label: 'Expiring Soon (≤90d)',
            icon: <Calendar className="w-3.5 h-3.5 text-amber-600" />,
            count: warrantyExpiringCount,
          },
          {
            id: 'warranty-expired',
            label: 'Warranty Expired',
            icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
            count: warrantyExpiredCount,
          },
        ],
      },
    ],
    [
      items.length,
      typeCounts,
      statusActiveCount,
      statusMaintenanceCount,
      statusDeprecatedCount,
      lifecycleDeployedCount,
      lifecycleInStockCount,
      lifecycleOrderedCount,
      lifecycleMaintenanceCount,
      lifecycleRetiredCount,
      warrantyActiveCount,
      warrantyExpiringCount,
      warrantyExpiredCount,
    ]
  );

  const handleSelectSidebarView = (viewId: string) => {
    setSelectedViewId(viewId);
    if (viewId !== 'service-cis' && location.pathname !== '/cmdb') {
      navigate('/cmdb', { replace: true });
    }
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
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'topology-tree':
        setViewGrouping('topology');
        break;
      case 'service-cis':
        setViewGrouping('services');
        break;
      case 'type-server':
        setViewGrouping('all');
        setSelectedType('Server');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'type-application':
        setViewGrouping('all');
        setSelectedType('Application');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'type-database':
        setViewGrouping('all');
        setSelectedType('Database');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'type-network':
        setViewGrouping('all');
        setSelectedType('Network');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'type-cloud':
        setViewGrouping('all');
        setSelectedType('Cloud Service');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'type-security':
        setViewGrouping('all');
        setSelectedType('Security');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'active':
      case 'status-active':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('Active');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'maintenance':
      case 'status-maintenance':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('Maintenance');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'status-deprecated':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('Deprecated');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('ALL');
        break;
      case 'lifecycle-deployed':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('Deployed');
        setSelectedWarranty('ALL');
        break;
      case 'lifecycle-in-stock':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('In Stock');
        setSelectedWarranty('ALL');
        break;
      case 'lifecycle-ordered':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('Ordered');
        setSelectedWarranty('ALL');
        break;
      case 'lifecycle-maintenance':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('Maintenance');
        setSelectedWarranty('ALL');
        break;
      case 'lifecycle-retired':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('Retired');
        setSelectedWarranty('ALL');
        break;
      case 'warranty-active':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('active');
        break;
      case 'warranty-expiring':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
        setSelectedWarranty('warning');
        break;
      case 'warranty-expired':
        setViewGrouping('all');
        setSelectedType('ALL');
        setSelectedStatus('ALL');
        setSelectedLifecycle('ALL');
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
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#C96F55]/50 transition-all duration-200 flex h-full min-w-0 flex-col justify-between cursor-pointer group"
        title="Click to view full specifications, topology and dependencies"
      >
        <div>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-orange-50/50 transition-colors shrink-0">
                {getCiIcon(ci.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-extrabold text-[#C96F55] tracking-wide block break-words">
                    {ci.tag}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    {ci.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#C96F55] transition-colors leading-snug mt-0.5 break-words">
                  {ci.name}
                </h3>
              </div>
            </div>
            <StatusBadge
              status={ci.status}
              variant={getCiStatusVariant(ci.status)}
              size="sm"
              className="shrink-0 self-start"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 mb-3 bg-slate-50/60 rounded-xl px-3 mt-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Site / Location
              </span>
              <span className="font-semibold text-slate-700 flex items-start gap-1 break-words text-[11px] mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {ci.site}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Lifecycle
              </span>
              <span className="font-semibold text-slate-700 text-[11px] mt-0.5 block break-words">
                {ci.lifecycleState || 'In Production'}
              </span>
            </div>
            {ci.ipAddress && (
              <div className="col-span-2 pt-1 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 break-all">IP: {ci.ipAddress}</span>
                {ci.specifications?.os && (
                  <span className="text-[10px] text-slate-500 break-words text-right">
                    {ci.specifications.os}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-2 pt-1 text-xs">
          <div className="flex min-w-0 items-start gap-1.5 text-slate-500">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium break-words">
              {ci.businessOwner || 'IT Operations'}
            </span>
          </div>

          {warranty ? (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border break-words text-right ${warranty.badgeClass}`}
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

      <div className="flex flex-1 h-full min-h-0 w-full min-w-0 flex-row items-stretch overflow-hidden pt-3 px-3 sm:px-[18px] pb-4 sm:pb-6 gap-3 sm:gap-4">
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
          hideZeroCountBadges
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

        <main className="flex-1 flex flex-col min-w-0 w-full min-h-0 h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0 bg-white gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{currentViewLabel}</span>
                {viewGrouping !== 'services' ? (
                  <span className="text-xs font-normal text-slate-500">
                    ({filteredCis.length} {filteredCis.length === 1 ? 'record' : 'records'})
                  </span>
                ) : (
                  <span className="text-xs font-normal text-slate-500">
                    (Business Services &amp; Reliability Targets)
                  </span>
                )}
              </h2>
              {(selectedType !== 'ALL' ||
                selectedStatus !== 'ALL' ||
                selectedLifecycle !== 'ALL' ||
                selectedWarranty !== 'ALL' ||
                selectedViewId !== 'all-cis') &&
                viewGrouping !== 'services' && (
                  <button
                    type="button"
                    onClick={() => handleSelectSidebarView('all-cis')}
                    className="text-[11px] font-semibold text-[#C96F55] hover:text-[#B55F46] bg-[#FFF9F5] border border-[#ebdcd3] px-2.5 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                    title="Clear active filter and return to all configuration items"
                  >
                    <span>Clear Filter</span>
                    <span>✕</span>
                  </button>
                )}
            </div>

            {viewGrouping !== 'services' && (
              <div className="flex items-center gap-3 flex-wrap">
                <RefreshButton
                  onClick={loadData}
                  isLoading={isLoading}
                  title="Refresh CMDB from Backend"
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {viewGrouping === 'services' ? (
              <ServiceCisView
                searchFilter={searchQuery}
                onNavigateToInventory={() => handleSelectSidebarView('all-cis')}
              />
            ) : viewGrouping === 'topology' ? (
              <div className="space-y-4">
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
                      const rootKey = selectedTopologyRootCi.tag || selectedTopologyRootCi.id;
                      await addCiRelationship(rootKey, {
                        targetId,
                        type: type as any,
                        direction,
                      });
                      await loadTopology();
                      await loadData();
                    }}
                    onUnlinkRelationship={async (targetId) => {
                      const rootKey = selectedTopologyRootCi.tag || selectedTopologyRootCi.id;
                      await deleteCiRelationship(rootKey, targetId);
                      await loadTopology();
                      await loadData();
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
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
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
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
                        {matchedCategoryItems.map(renderCiCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
                {filteredCis.map(renderCiCard)}
              </div>
            )}
          </div>
        </main>
      </div>

      <CiDetailModal
        ci={selectedCiForModal}
        allCis={items}
        onClose={handleCloseCiModal}
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
