import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ChangeRequest } from '../../types/cmdb';
import { fetchChangeRequests } from '../../services/changeRequestsService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import {
  LayoutGrid,
  Table,
  Plus,
  Clock,
  AlertCircle,
  Flame,
  ListFilter,
  GitPullRequest,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Layers,
  PauseCircle,
  HelpCircle,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { RefreshButton, SearchInput, ModuleSidebar, ModuleSidebarGroup } from '../../components/shared';

interface ChangeRequestsPageProps {
  changeRequests?: ChangeRequest[];
  searchQuery?: string;
  onOpenCreateModal?: () => void;
  onSelectChangeRequest?: (cr: ChangeRequest) => void;
  onRefreshData?: () => void;
}

export const ChangeRequestsPage: React.FC<ChangeRequestsPageProps> = ({
  changeRequests: externalRequests,
  searchQuery: externalSearchQuery = '',
  onOpenCreateModal = () => {},
  onSelectChangeRequest = () => {},
  onRefreshData,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ciId = searchParams.get('ci');
  const ciName = searchParams.get('ciName');

  const [internalRequests, setInternalRequests] = useState<ChangeRequest[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string>('all-active');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(!externalRequests);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 6;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchChangeRequests();
      setInternalRequests(res.data);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('[ChangeRequestsPage] Error fetching requests:', err);
      setError(err?.message || 'Failed to fetch Change Requests from server.');
    } finally {
      setIsLoading(false);
    }
  }, [onRefreshData]);

  useEffect(() => {
    if (!externalRequests) {
      loadData();
    } else {
      setInternalRequests(externalRequests);
    }
  }, [externalRequests, loadData]);

  const items = externalRequests || internalRequests;

  // Compute live view counts for the sidebar
  const counts = useMemo(() => {
    const all = items.length;
    const active = items.filter(
      (cr) => cr.status !== 'Completed' && cr.status !== 'Rejected' && cr.status !== 'Failed'
    ).length;
    const draft = items.filter((cr) => cr.status.toLowerCase().includes('draft')).length;
    const inProgress = items.filter((cr) => cr.status === 'In Progress').length;
    const scheduled = items.filter((cr) => cr.status === 'Scheduled').length;
    const pendingApproval = items.filter((cr) => cr.status === 'Pending Approval').length;
    const onHold = items.filter((cr) => cr.status === 'On Hold').length;
    const emergency = items.filter((cr) => cr.type === 'Emergency').length;
    const normal = items.filter((cr) => cr.type === 'Normal').length;
    const standard = items.filter((cr) => cr.type === 'Standard').length;
    const completed = items.filter((cr) => cr.status === 'Completed').length;

    return {
      all,
      active,
      draft,
      inProgress,
      scheduled,
      pendingApproval,
      onHold,
      emergency,
      normal,
      standard,
      completed,
    };
  }, [items]);

  // Sidebar navigation structure inspired by reference design with brand soft-peach styling
  const rawSidebarGroups: ModuleSidebarGroup[] = useMemo(
    () => [
      {
        id: 'active-group',
        title: 'Active',
        items: [
          {
            id: 'all-active',
            label: 'All Active Changes',
            icon: <Flame className="w-3.5 h-3.5 text-[#C96F55]" />,
          },
          {
            id: 'draft',
            label: 'Draft Changes',
            icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
          },
          {
            id: 'in-progress',
            label: 'In Progress Changes',
            icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
          },
          {
            id: 'scheduled',
            label: "Today's Scheduled",
            icon: <Calendar className="w-3.5 h-3.5 text-blue-500" />,
            count: counts.scheduled,
          },
        ],
      },
      {
        id: 'pending-group',
        title: 'Pending & Review',
        items: [
          {
            id: 'pending-approval',
            label: 'Awaiting Approval',
            icon: <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />,
            count: counts.pendingApproval,
          },
          {
            id: 'on-hold',
            label: 'On Hold Changes',
            icon: <PauseCircle className="w-3.5 h-3.5 text-orange-500" />,
          },
        ],
      },
      {
        id: 'type-group',
        title: 'By Change Type',
        items: [
          {
            id: 'all',
            label: 'All Changes',
            icon: <ListFilter className="w-3.5 h-3.5 text-slate-600" />,
          },
          {
            id: 'emergency',
            label: 'Emergency Changes',
            icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
            count: counts.emergency,
          },
          {
            id: 'normal',
            label: 'Normal Changes',
            icon: <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />,
          },
          {
            id: 'standard',
            label: 'Standard Changes',
            icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />,
          },
        ],
      },
      {
        id: 'history-group',
        title: 'History',
        items: [
          {
            id: 'completed',
            label: 'Completed Changes',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
          },
        ],
      },
    ],
    [counts]
  );

  // Filter change requests based on selected sidebar view & sidebar record search
  const filteredRequests = useMemo(() => {
    return items.filter((cr: ChangeRequest) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cr.title.toLowerCase().includes(q) ||
        cr.id.toLowerCase().includes(q) ||
        cr.agentName.toLowerCase().includes(q) ||
        cr.linkedCiName.toLowerCase().includes(q);

      let matchesView = true;
      switch (selectedViewId) {
        case 'all-active':
          matchesView =
            cr.status !== 'Completed' && cr.status !== 'Rejected' && cr.status !== 'Failed';
          break;
        case 'draft':
          matchesView = cr.status.toLowerCase().includes('draft');
          break;
        case 'in-progress':
          matchesView = cr.status === 'In Progress';
          break;
        case 'scheduled':
          matchesView = cr.status === 'Scheduled';
          break;
        case 'pending-approval':
          matchesView = cr.status === 'Pending Approval';
          break;
        case 'on-hold':
          matchesView = cr.status === 'On Hold';
          break;
        case 'emergency':
          matchesView = cr.type === 'Emergency';
          break;
        case 'normal':
          matchesView = cr.type === 'Normal';
          break;
        case 'standard':
          matchesView = cr.type === 'Standard';
          break;
        case 'completed':
          matchesView = cr.status === 'Completed';
          break;
        case 'all':
        default:
          matchesView = true;
          break;
      }

      const matchesCi =
        !ciId && !ciName
          ? true
          : (cr.linkedCiId && cr.linkedCiId.toLowerCase() === ciId?.toLowerCase()) ||
            (cr.linkedCiName && ciName && cr.linkedCiName.toLowerCase().includes(ciName.toLowerCase())) ||
            cr.title.toLowerCase().includes((ciName || ciId || '').toLowerCase());

      return matchesSearch && matchesView && matchesCi;
    });
  }, [items, searchQuery, selectedViewId, ciId, ciName]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const pageStart = filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filteredRequests.length);

  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const currentViewLabel = useMemo(() => {
    for (const group of rawSidebarGroups) {
      const found = group.items.find((i) => i.id === selectedViewId);
      if (found) return found.label;
    }
    return 'Change Requests';
  }, [selectedViewId, rawSidebarGroups]);

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-[#FFF9F5] overflow-hidden font-sans select-none">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-30 min-h-[50px] sticky top-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Change Requests</span>
        </div>
        <GlobalNavbarActions />
      </header>

      {/* CI Filter Active Notification */}
      {(ciId || ciName) && (
        <div className="mx-[18px] mt-3 px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between text-xs font-semibold shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>
              Showing change requests linked to Configuration Item: <strong>{ciName || ciId}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('ci');
              nextParams.delete('ciName');
              setSearchParams(nextParams);
            }}
            className="text-purple-700 hover:text-purple-950 font-bold cursor-pointer underline text-[11px]"
          >
            Clear filter ✕
          </button>
        </div>
      )}

      {/* ── Two-Column Layout (Sidebar + Main Panel) ── */}
      <div className="flex flex-1 h-full min-h-0 w-full overflow-hidden pt-3 px-[18px] pb-6 gap-4">
        {/* Left Module Sidebar */}
        <ModuleSidebar
          title="Change Requests"
          icon={<GitPullRequest className="w-3.5 h-3.5" />}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search change requests..."
          groups={rawSidebarGroups}
          selectedId={selectedViewId}
          onSelectId={(id) => {
            setSelectedViewId(id);
            setCurrentPage(1);
          }}
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="w-full justify-center shadow-xs"
            >
              New Change Request
            </Button>
          }
        />

        {/* Right Main Table/Grid Panel */}
        <main className="flex-1 flex flex-col min-w-[340px] h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          {/* Main Top Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0 bg-white gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>{currentViewLabel}</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View Switcher: Grid / Table */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#C96F55] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-[#C96F55] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table view"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top Toolbar Pagination Count */}
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {pageStart}-{pageEnd} of {filteredRequests.length}
              </span>

              {/* Top Toolbar Page Navigation Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                  title="Previous page"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                  title="Next page"
                >
                  ›
                </button>
              </div>

              {/* Standardized Context Refresh Button */}
              <RefreshButton
                size="sm"
                onClick={() => loadData()}
                isLoading={isLoading}
                title="Refresh Change Requests"
              />

              {/* Primary Action Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenCreateModal}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="shadow-xs"
              >
                New
              </Button>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
                <button
                  onClick={() => loadData()}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors cursor-pointer text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedRequests.map((cr: ChangeRequest) => {
                  const completedSubtasks = cr.subtasks.filter((s) => s.completed).length;

                  return (
                    <Card
                      key={cr.id}
                      onClick={() => onSelectChangeRequest(cr)}
                      className="group hover:border-[#C96F55]/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-xs font-extrabold text-[#C96F55] tracking-wider block mb-1">
                              {cr.id}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#C96F55] transition-colors">
                              {cr.title}
                            </h3>
                          </div>
                          <StatusBadge
                            label={cr.status}
                            variant={getChangeStatusVariant(cr.status)}
                          />
                        </div>

                        <div className="space-y-2.5 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium">Assigned Agent</span>
                            <span className="font-bold text-slate-800">{cr.agentName}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium">Target / Spent</span>
                            <span className="font-bold text-slate-800">
                              {cr.timeSpentHours}h / {cr.targetHours}h
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium">Linked CI</span>
                            <span className="font-bold text-[#263B5E] truncate max-w-[150px]">
                              {cr.linkedCiName}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60">
                            <div className="flex justify-between items-center text-[11px] mb-1">
                              <span className="text-slate-500 font-semibold">Implementation Progress</span>
                              <span className="font-extrabold text-slate-800">{cr.completionPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#C96F55] h-full rounded-full transition-all duration-300"
                                style={{ width: `${cr.completionPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cr.scheduledStart}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {completedSubtasks}/{cr.subtasks.length} tasks
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              cr.risk === 'High'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : cr.risk === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {cr.risk} Risk
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {paginatedRequests.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                    <p className="text-sm font-bold text-slate-600">No Change Requests Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your sidebar view or search filter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">CR ID</th>
                        <th className="py-3.5 px-4">Title</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Risk</th>
                        <th className="py-3.5 px-4">Linked CI</th>
                        <th className="py-3.5 px-4">Owner</th>
                        <th className="py-3.5 px-4">Progress</th>
                        <th className="py-3.5 px-4">Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRequests.map((cr: ChangeRequest) => (
                        <tr
                          key={cr.id}
                          onClick={() => onSelectChangeRequest(cr)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-extrabold text-[#C96F55]">{cr.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 max-w-[220px] truncate">
                            {cr.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {cr.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge
                              label={cr.status}
                              variant={getChangeStatusVariant(cr.status)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                cr.risk === 'High'
                                  ? 'text-rose-700 bg-rose-50'
                                  : cr.risk === 'Medium'
                                  ? 'text-amber-700 bg-amber-50'
                                  : 'text-emerald-700 bg-emerald-50'
                              }`}
                            >
                              {cr.risk}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium truncate max-w-[140px]">
                            {cr.linkedCiName}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{cr.agentName}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#C96F55] h-full rounded-full"
                                  style={{ width: `${cr.completionPercent}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 text-[10px]">
                                {cr.completionPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {cr.scheduledStart}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {paginatedRequests.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-600">No Change Requests Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your sidebar view or search filter.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
