import React, { useState } from 'react';
import type { ChangeRequest } from '../../types/cmdb';
import { mockChangeRequests } from '../../data/mockCmdbData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getChangeStatusVariant } from '../../utils/statusUtils';
import { LayoutGrid, Table, Plus, Clock, Tag as TagIcon, AlertCircle } from 'lucide-react';

interface ChangeRequestsPageProps {
  changeRequests?: ChangeRequest[];
  searchQuery?: string;
  onOpenCreateModal?: () => void;
  onSelectChangeRequest?: (cr: ChangeRequest) => void;
}

export const ChangeRequestsPage: React.FC<ChangeRequestsPageProps> = ({
  changeRequests = mockChangeRequests,
  searchQuery = '',
  onOpenCreateModal = () => {},
  onSelectChangeRequest = () => {},
}) => {
  const items = changeRequests.length > 0 ? changeRequests : mockChangeRequests;
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredRequests = items.filter((cr) => {
    const matchesSearch =
      cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.linkedCiName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || cr.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || cr.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getPercentBadgeVariant = (percent: number) => {
    if (percent >= 60) return 'green';
    if (percent >= 30) return 'orange';
    return 'red';
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8F9FD] select-none">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Change Requests & Active Changes
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage, track, and audit active change requests, timelines, and subtask implementations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Pagination
            currentRange={`1-${filteredRequests.length} of ${filteredRequests.length}`}
            hasPrevious={false}
            hasNext={false}
          />

          <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#E87A5D] text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#E87A5D] text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={onOpenCreateModal} icon={<Plus className="w-4 h-4" />}>
            + New
          </Button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 uppercase">Type:</span>
          {['ALL', 'Standard', 'Normal', 'Emergency'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === type
                  ? 'bg-[#1B254B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="flex flex-col gap-6">
          {filteredRequests.map((cr) => (
            <Card
              key={cr.id}
              onClick={() => onSelectChangeRequest(cr)}
              className="group relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 flex flex-col justify-between pr-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#E87A5D] group-hover:text-[#D96A4C] transition-colors leading-tight">
                        {cr.title}
                      </h3>
                      <span className="text-lg font-bold text-slate-800 shrink-0">{cr.id}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-4">{cr.agentName}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <StatusBadge
                      label={`${cr.completionPercent}% COMPLETE`}
                      variant={getPercentBadgeVariant(cr.completionPercent)}
                    />
                    <StatusBadge
                      label={cr.status}
                      variant={getChangeStatusVariant(cr.status)}
                    />
                    {cr.type === 'Emergency' && <StatusBadge label="EMERGENCY" variant="red" />}
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col justify-between px-0 lg:px-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0">
                  <div>
                    <h4 className="text-xs font-bold text-[#E87A5D] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Timeline
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 font-medium block">Start</span>
                        <span className="font-bold text-slate-800">{cr.scheduledStart}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Target</span>
                        <span className="font-bold text-slate-800">{cr.scheduledEnd}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 font-medium">Time Spent</span>
                      <span className="font-bold text-[#E87A5D]">
                        {cr.timeSpentHours}h / {cr.targetHours}h
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E87A5D] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (cr.timeSpentHours / cr.targetHours) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 pl-0 lg:pl-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Subtasks ({cr.subtasks.filter((st) => st.completed).length}/{cr.subtasks.length})
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <TagIcon className="w-3.5 h-3.5" /> {cr.linkedCiName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cr.subtasks.slice(0, 6).map((subtask) => (
                      <div
                        key={subtask.id}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                          subtask.completed
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-slate-100/60 border-slate-200/70 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-500">{subtask.id}</span>
                        <span className="text-[11px] font-medium leading-tight line-clamp-2">
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredRequests.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Change Requests found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Change ID</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Linked CI</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Target Date</th>
                <th className="py-3.5 px-4 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRequests.map((cr) => (
                <tr
                  key={cr.id}
                  onClick={() => onSelectChangeRequest(cr)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-bold text-[#E87A5D]">{cr.id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">{cr.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {cr.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge label={cr.status} variant={getChangeStatusVariant(cr.status)} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{cr.linkedCiName}</td>
                  <td className="py-3.5 px-4">{cr.agentName}</td>
                  <td className="py-3.5 px-4">{cr.scheduledEnd}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#E87A5D]">
                    {cr.completionPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
