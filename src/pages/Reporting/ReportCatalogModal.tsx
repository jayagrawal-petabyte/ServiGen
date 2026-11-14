import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Sparkles, Clock, ArrowRight, BarChart3, CheckCircle2, ShieldAlert, Database, Layers, X } from 'lucide-react';
import { PRE_BUILT_REPORTS, PreBuiltReportItem } from './reportCatalog.data';

interface ReportCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: PreBuiltReportItem) => void;
  activeReportId?: string;
}

type CategoryTab = 'all' | 'incidents' | 'sla' | 'agents' | 'changes' | 'cmdb' | 'requests';

export const ReportCatalogModal: React.FC<ReportCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
  activeReportId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');

  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PRE_BUILT_REPORTS.filter((rep) => {
      const matchCategory = selectedCategory === 'all' || rep.category === selectedCategory;
      const matchSearch =
        !q ||
        rep.title.toLowerCase().includes(q) ||
        rep.description.toLowerCase().includes(q) ||
        rep.categoryLabel.toLowerCase().includes(q) ||
        rep.id.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PRE_BUILT_REPORTS.length };
    for (const r of PRE_BUILT_REPORTS) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, []);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'incidents':
        return <BarChart3 className="w-3.5 h-3.5 text-blue-500" />;
      case 'sla':
        return <Clock className="w-3.5 h-3.5 text-emerald-500" />;
      case 'agents':
        return <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'changes':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
      case 'cmdb':
        return <Database className="w-3.5 h-3.5 text-cyan-500" />;
      case 'requests':
        return <Layers className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <BarChart3 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF7F5] rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-4xl max-h-[88vh] z-50 flex flex-col overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-[#eb6a47] rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  ITIL Pre-Built Reports Catalog
                </Dialog.Title>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {PRE_BUILT_REPORTS.length} Templates
                </span>
              </div>
              <Dialog.Description className="text-xs text-slate-500 mt-1">
                Browse standardized Halo-compliant ITIL reports across Incidents, SLAs, Agents, Changes, and CMDB.
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white px-6 py-3 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report titles, descriptions, metrics..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#eb6a47] focus:bg-white text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Count Badge */}
            <span className="text-xs text-slate-500 self-center">
              Showing <strong>{filteredReports.length}</strong> of {PRE_BUILT_REPORTS.length} reports
            </span>
          </div>

          {/* Category Pills Bar */}
          <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'incidents', label: 'Incidents' },
              { id: 'sla', label: 'SLA & OLA' },
              { id: 'agents', label: 'Agents & Workload' },
              { id: 'changes', label: 'Changes & CAB' },
              { id: 'cmdb', label: 'CMDB & Assets' },
              { id: 'requests', label: 'Service Catalog' },
            ].map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const count = categoryCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as CategoryTab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#eb6a47] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Report Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No reports matched your search</p>
                <p className="text-xs text-slate-400 mt-1">Try different search keywords or switch category filter.</p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isActive = activeReportId === report.id;
                return (
                  <div
                    key={report.id}
                    className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
                      isActive ? 'border-[#eb6a47] ring-1 ring-[#eb6a47]/30 bg-orange-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {getCategoryIcon(report.category)}
                          <span>{report.categoryLabel}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {report.popular && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            {report.id}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#eb6a47] transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {report.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Launch Action */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Key Metric
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {report.sampleMetric}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectReport(report);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#eb6a47] hover:bg-[#db5936] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>▶ Run Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              💡 <em>Select any report to load its live dataset, KPI cards, and exportable grid.</em>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close Catalog
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ReportCatalogModal;
