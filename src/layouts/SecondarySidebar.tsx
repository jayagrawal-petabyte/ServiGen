import React from 'react';
import { Search, Plus, ListFilter, Server, RefreshCw, Activity, Layers } from 'lucide-react';
import type { ActiveModule } from './PrimarySidebar';

export type CmdbSubView = 'active-changes' | 'all-changes' | 'cmdb-items' | 'service-cis';

interface SecondarySidebarProps {
  activeModule: ActiveModule;
  activeSubView: CmdbSubView;
  onSelectSubView: (view: CmdbSubView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNewList?: () => void;
}

export const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
  activeModule,
  activeSubView,
  onSelectSubView,
  searchQuery,
  onSearchChange,
  onCreateNewList,
}) => {
  const isCmdbOrChanges = activeModule === 'cmdb' || activeModule === 'change-requests';

  return (
    <aside className="w-60 bg-white p-4 flex flex-col gap-6 shrink-0 border-r border-slate-200 select-none shadow-xs">
      {/* Search Bar Input */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            activeModule === 'cmdb'
              ? 'Search CIs & Services...'
              : activeModule === 'change-requests'
              ? 'Search Change Requests...'
              : 'Search Items...'
          }
          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00bcd4] focus:bg-white shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Module Sections */}
      {isCmdbOrChanges ? (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          {/* Section: Change Requests (Vooka Sai Siddharth) */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-3 px-2">
              Change Management
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSelectSubView('active-changes')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeSubView === 'active-changes'
                    ? 'bg-[#00bcd4] text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Active Change Requests</span>
              </button>

              <button
                onClick={() => onSelectSubView('all-changes')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeSubView === 'all-changes'
                    ? 'bg-[#00bcd4] text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>All Changes & History</span>
              </button>
            </div>
          </div>

          {/* Section: CMDB Assets & CIs (Vooka Sai Siddharth) */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-3 px-2">
              CMDB Assets & CIs
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSelectSubView('cmdb-items')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeSubView === 'cmdb-items'
                    ? 'bg-[#00bcd4] text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Configuration Items (CIs)</span>
              </button>

              <button
                onClick={() => onSelectSubView('service-cis')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeSubView === 'service-cis'
                    ? 'bg-[#00bcd4] text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Service CIs (Live Health)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-3 px-2">
              Module View
            </h3>
            <p className="text-xs text-slate-500 px-2">
              Select <strong>Change Requests</strong> or <strong>CMDB</strong> in the primary sidebar to view Vooka Sai Siddharth's assigned modules.
            </p>
          </div>
        </div>
      )}

      {/* Action Button at Bottom */}
      <div className="pt-2">
        <button
          onClick={onCreateNewList}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00bcd4] hover:bg-[#00a2b8] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create a New list</span>
        </button>
      </div>
    </aside>
  );
};
