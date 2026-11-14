import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sliders, Play, X, BarChart3, PieChart, Table as TableIcon, Sparkles } from 'lucide-react';

export interface CustomQueryConfig {
  title: string;
  entity: 'incidents' | 'requests' | 'changes' | 'problems' | 'assets';
  metric: 'count' | 'slaMet' | 'duration' | 'hours';
  groupBy: 'category' | 'priority' | 'agent' | 'site' | 'status';
  timeRange: 'today' | '7days' | '30days' | 'quarter' | 'all';
  chartType: 'bar' | 'donut' | 'table';
}

interface QueryBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteQuery: (config: CustomQueryConfig) => void;
}

export const QueryBuilderModal: React.FC<QueryBuilderModalProps> = ({
  isOpen,
  onClose,
  onExecuteQuery,
}) => {
  const [title, setTitle] = useState('Custom Analysis: Tickets by Priority & Team');
  const [entity, setEntity] = useState<CustomQueryConfig['entity']>('incidents');
  const [metric, setMetric] = useState<CustomQueryConfig['metric']>('count');
  const [groupBy, setGroupBy] = useState<CustomQueryConfig['groupBy']>('priority');
  const [timeRange, setTimeRange] = useState<CustomQueryConfig['timeRange']>('30days');
  const [chartType, setChartType] = useState<CustomQueryConfig['chartType']>('bar');

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteQuery({
      title: title.trim() || 'Custom Ad-Hoc Report',
      entity,
      metric,
      groupBy,
      timeRange,
      chartType,
    });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-2xl max-h-[90vh] z-50 flex flex-col overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="bg-[#FAF7F5] px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  No-Code Custom Report &amp; Query Builder
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Build custom ad-hoc cross-cutting reports across ITIL modules without writing SQL.
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleRun} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Report Title */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Report Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical Incidents Breaching SLA by Region"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                required
              />
            </div>

            {/* Grid of 2 Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entity */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Entity / Dataset</label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                >
                  <option value="incidents">Tickets &amp; Incidents</option>
                  <option value="requests">Service Requests &amp; Orders</option>
                  <option value="changes">Change Requests &amp; RFCs</option>
                  <option value="problems">Problems &amp; Known Errors</option>
                  <option value="assets">CMDB Assets &amp; Hardware</option>
                </select>
              </div>

              {/* Aggregation Metric */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Aggregation Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                >
                  <option value="count">Record Volume Count (Total #)</option>
                  <option value="slaMet">SLA Resolution Met Percentage (%)</option>
                  <option value="duration">Average Handling / Resolution Time</option>
                  <option value="hours">Total Project Hours Spent</option>
                </select>
              </div>

              {/* Group By Field */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Group By Dimension</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                >
                  <option value="category">Category (Service Taxonomy)</option>
                  <option value="priority">Priority (Critical, High, Medium, Low)</option>
                  <option value="agent">Assigned Agent / Team Lead</option>
                  <option value="site">Site / Geographic Region</option>
                  <option value="status">Status &amp; Lifecycle Stage</option>
                </select>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Date Range Window</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb6a47] font-medium"
                >
                  <option value="today">Today (Last 24 Hours)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days (Rolling)</option>
                  <option value="quarter">Quarter to Date (Q2 2026)</option>
                  <option value="all">All-Time Historical Dataset</option>
                </select>
              </div>
            </div>

            {/* Visualization Mode */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Chart Visualization Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'donut', label: 'Donut Chart', icon: <PieChart className="w-4 h-4" /> },
                  { id: 'table', label: 'Data Grid Table', icon: <TableIcon className="w-4 h-4" /> },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setChartType(mode.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      chartType === mode.id
                        ? 'border-[#eb6a47] bg-orange-50/50 text-[#eb6a47] font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mode.icon}
                    <span className="text-xs">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Summary Callout */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-snug">
                <strong>Generated Query Definition:</strong> Aggregate{' '}
                <span className="font-bold text-slate-800">{entity}</span> by{' '}
                <span className="font-bold text-slate-800">{groupBy}</span> computing{' '}
                <span className="font-bold text-slate-800">{metric}</span> over{' '}
                <span className="font-bold text-slate-800">{timeRange}</span>. Visualized as{' '}
                <span className="font-bold text-slate-800">{chartType}</span>.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Query &amp; Load Report</span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default QueryBuilderModal;
