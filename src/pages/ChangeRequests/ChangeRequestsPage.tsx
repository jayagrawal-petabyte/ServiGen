import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeRequest, SubTask } from '../../types/cmdb';
import {
  fetchChangeRequests,
  fetchActiveChangeRequests,
} from '../../services/changeRequestsService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import {
  LayoutGrid,
  Table,
  Plus,
  Clock,
  Tag as TagIcon,
  AlertCircle,
  RefreshCw,
  Flame,
  ListFilter,
} from 'lucide-react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';

interface ChangeRequestsPageProps {
  changeRequests?: ChangeRequest[];
  searchQuery?: string;
  onOpenCreateModal?: () => void;
  onSelectChangeRequest?: (cr: ChangeRequest) => void;
  onRefreshData?: () => void;
}

export const ChangeRequestsPage: React.FC<ChangeRequestsPageProps> = ({
  changeRequests: externalRequests,
  searchQuery = '',
  onOpenCreateModal = () => {},
  onSelectChangeRequest = () => {},
  onRefreshData,
}) => {
  const navigate = useNavigate();
  const [internalRequests, setInternalRequests] = useState<ChangeRequest[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(!externalRequests);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 6;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (filterMode === 'active') {
        const res = await fetchActiveChangeRequests();
        setInternalRequests(res.data);
      } else {
        const res = await fetchChangeRequests();
        setInternalRequests(res.data);
      }
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('[ChangeRequestsPage] Error fetching requests:', err);
      setError(err?.message || 'Failed to fetch Change Requests from server.');
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, onRefreshData]);

  useEffect(() => {
    if (!externalRequests) {
      loadData();
    } else {
      setInternalRequests(externalRequests);
    }
  }, [externalRequests, loadData]);

  const items = externalRequests || internalRequests;

  const filteredRequests = items.filter((cr: ChangeRequest) => {
    const matchesSearch =
      cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.linkedCiName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || cr.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || cr.status === selectedStatus;
    const matchesActiveTab = filterMode === 'all' || cr.status !== 'Completed';

    return matchesSearch && matchesType && matchesStatus && matchesActiveTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getPercentBadgeVariant = (percent: number) => {
    if (percent >= 60) return 'green';
    if (percent >= 30) return 'orange';
    return 'red';
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#faf6f2] select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Change Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Active change requests, implementation windows, risk review, and rollback checklists
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Fetch latest from backend API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#eb6a47]' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* New Change Request Button */}
          <Button
            variant="primary"
            onClick={onOpenCreateModal}
            className="shadow-md shadow-[#eb6a47]/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Change Request</span>
          </Button>

          <GlobalNavbarActions />
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

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Left: Active vs All tabs (corresponds to backend /api/change-requests/active) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setFilterMode('all');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> All Changes
            </button>
            <button
              onClick={() => {
                setFilterMode('active');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-[#eb6a47] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Active Only
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
          >
            <option value="ALL">All Change Types</option>
            <option value="Normal">Normal</option>
            <option value="Standard">Standard</option>
            <option value="Emergency">Emergency</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#eb6a47]"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#eb6a47] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#eb6a47] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {filteredRequests.length} results
          </span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRequests.map((cr: ChangeRequest) => {
            const completedSubtasks = cr.subtasks.filter((s) => s.completed).length;

            return (
              <Card
                key={cr.id}
                onClick={() => onSelectChangeRequest(cr)}
                className="group hover:border-[#eb6a47]/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-extrabold text-[#eb6a47] tracking-wider block mb-1">
                        {cr.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#eb6a47] transition-colors">
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
                      <span className="font-bold text-indigo-600 truncate max-w-[150px]">
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
                          className="bg-[#eb6a47] h-full rounded-full transition-all duration-300"
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
                Try adjusting your search criteria or create a new change request.
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
                    <td className="py-3 px-4 font-extrabold text-[#eb6a47]">{cr.id}</td>
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
                            className="bg-[#eb6a47] h-full rounded-full"
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
        </div>
      )}

      {/* Pagination Footer */}
      {filteredRequests.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRequests.length)} of{' '}
            {filteredRequests.length} change requests
          </p>

          <Pagination
            currentRange={`Page ${currentPage} of ${totalPages}`}
            hasPrevious={currentPage > 1}
            hasNext={currentPage < totalPages}
            onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}
    </div>
  );
};
