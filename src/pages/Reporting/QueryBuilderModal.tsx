import React, { useState } from 'react';
import { Sliders, Play, BarChart3, PieChart, Table as TableIcon, Sparkles } from 'lucide-react';
import { ModalShell } from '../../components/shared/ModalShell';

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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<Sliders className="w-4 h-4" />}
      title="No-Code Custom Report & Query Builder"
      description="Build custom ad-hoc cross-cutting reports across ITIL modules without writing SQL."
    >
      <form onSubmit={handleRun} className="p-6 space-y-5 text-xs text-slate-700">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Report Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical Incidents Breaching SLA by Region"
                className="w-full px-3 py-2 border border-[#ebdcd3] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C96F55] font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Entity / Dataset</label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ebdcd3] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C96F55] font-medium"
                >
                  <option value="incidents">Tickets &amp; Incidents</option>
                  <option value="requests">Service Requests &amp; Orders</option>
                  <option value="changes">Change Requests &amp; RFCs</option>
                  <option value="problems">Problems &amp; Known Errors</option>
                  <option value="assets">CMDB Assets &amp; Hardware</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Aggregation Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ebdcd3] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C96F55] font-medium"
                >
                  <option value="count">Record Volume Count (Total #)</option>
                  <option value="slaMet">SLA Resolution Met Percentage (%)</option>
                  <option value="duration">Average Handling / Resolution Time</option>
                  <option value="hours">Total Project Hours Spent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Group By Dimension</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ebdcd3] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C96F55] font-medium"
                >
                  <option value="category">Category (Service Taxonomy)</option>
                  <option value="priority">Priority (Critical, High, Medium, Low)</option>
                  <option value="agent">Assigned Agent / Team Lead</option>
                  <option value="site">Site / Geographic Region</option>
                  <option value="status">Status &amp; Lifecycle Stage</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date Range Window</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ebdcd3] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C96F55] font-medium"
                >
                  <option value="today">Today (Last 24 Hours)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days (Rolling)</option>
                  <option value="quarter">Quarter to Date (Q2 2026)</option>
                  <option value="all">All-Time Historical Dataset</option>
                </select>
              </div>
            </div>

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
                        ? 'border-[#C96F55] bg-[#F7C4B3]/20 text-[#C96F55] font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mode.icon}
                    <span className="text-xs">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#332B28] hover:bg-[#FFF9F5] border border-[#ebdcd3] rounded-full cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Query &amp; Load Report</span>
              </button>
            </div>
          </form>
    </ModalShell>
  );
};

export default QueryBuilderModal;
