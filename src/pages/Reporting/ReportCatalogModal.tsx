import React, { useState, useMemo } from 'react';
import { Sparkles, Clock, ArrowRight, BarChart3, CheckCircle2, ShieldAlert, Database, Layers } from 'lucide-react';
import { PRE_BUILT_REPORTS, PreBuiltReportItem } from './reportCatalog.data';
import { ModalShell } from '../../components/shared/ModalShell';
import { FilterToolbar } from '../../components/shared/FilterToolbar';
import { SegmentedTabs } from '../../components/shared/SegmentedTabs';

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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<Sparkles className="w-4 h-4" />}
      title="ITIL Pre-Built Reports Catalog"
      description="Browse standardized Halo-compliant ITIL reports across Incidents, SLAs, Agents, Changes, and CMDB."
      headerActions={
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {PRE_BUILT_REPORTS.length} Templates
        </span>
      }
      footer={
        <div className="w-full flex items-center justify-between text-xs text-slate-500">
          <span>
            💡 <em>Select any report to load its live dataset, KPI cards, and exportable grid.</em>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Catalog
          </button>
        </div>
      }
    >
      <div>
        {/* Search & Category Filter Bar */}
        <div className="px-6 py-3 border-b border-[#ebdcd3] bg-white">
          <FilterToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search report titles, descriptions, metrics..."
            resultCount={filteredReports.length}
            totalCount={PRE_BUILT_REPORTS.length}
            countLabel={`Showing ${filteredReports.length} of ${PRE_BUILT_REPORTS.length} reports`}
            className="border-0 p-0 shadow-none"
          />
        </div>

        {/* Category Pills Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-[#ebdcd3]">
          <SegmentedTabs
            tabs={[
              { id: 'all', label: 'All Reports', count: categoryCounts['all'] },
              { id: 'incidents', label: 'Incidents', count: categoryCounts['incidents'] },
              { id: 'sla', label: 'SLA & OLA', count: categoryCounts['sla'] },
              { id: 'agents', label: 'Agents & Workload', count: categoryCounts['agents'] },
              { id: 'changes', label: 'Changes & CAB', count: categoryCounts['changes'] },
              { id: 'cmdb', label: 'CMDB & Assets', count: categoryCounts['cmdb'] },
              { id: 'requests', label: 'Service Catalog', count: categoryCounts['requests'] },
            ]}
            activeTab={selectedCategory}
            onChange={(tabId) => setSelectedCategory(tabId as CategoryTab)}
            variant="pill"
            theme="terracotta"
            ariaLabel="Report categories"
          />
        </div>

        {/* Report Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onClick={() => {
                      onSelectReport(report);
                      onClose();
                    }}
                    className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 cursor-pointer group ${
                      isActive ? 'border-[#C96F55] ring-1 ring-[#C96F55]/30 bg-[#F7C4B3]/20' : 'border-[#ebdcd3]'
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
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#C96F55] transition-colors">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReport(report);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-[#C96F55] hover:bg-[#b55f46] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
        </div>
    </ModalShell>
  );
};

export default ReportCatalogModal;
