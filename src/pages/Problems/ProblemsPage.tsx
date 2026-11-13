import React, { useState, useMemo, useEffect } from 'react';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { ProblemsSidebar } from './components/ProblemsSidebar';
import { NewProblemModal } from './components/NewProblemModal';
import { ProblemDetailView } from './ProblemDetailView';
import { problemsService } from './services/problemsService';
import { ProblemItem } from './types/problem.types';

export const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('open-problems');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'tile' | 'kanban'>('table');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    setProblems(problemsService.getProblems());
  }, []);

  // Filter problems based on sidebar selection and search query
  const filteredProblems = useMemo(() => {
    let list = [...problems];

    if (selectedListId === 'open-problems') {
      list = list.filter((p) => p.status !== 'Resolved' && p.status !== 'Closed');
    } else if (selectedListId === 'investigation') {
      list = list.filter((p) => p.currentStage === 'Investigation');
    } else if (selectedListId === 'workaround') {
      list = list.filter((p) => p.currentStage === 'Workaround' || p.causeStatus === 'Identified');
    } else if (selectedListId === 'known-error') {
      list = list.filter((p) => p.currentStage === 'Known Error Review');
    } else if (selectedListId === 'my-team') {
      list = list.filter((p) => p.team === 'Infrastructure' || p.team === 'Cloud Ops');
    } else if (selectedListId === 'resolved') {
      list = list.filter((p) => p.status === 'Resolved' || p.currentStage === 'Resolved');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.summary.toLowerCase().includes(q) ||
          p.id.includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.agent.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [problems, selectedListId, searchQuery]);

  const sidebarCounts = useMemo(() => {
    return {
      all: problems.length,
      open: problems.filter((p) => p.status !== 'Resolved' && p.status !== 'Closed').length,
      investigation: problems.filter((p) => p.currentStage === 'Investigation').length,
      workaround: problems.filter((p) => p.currentStage === 'Workaround' || p.causeStatus === 'Identified').length,
      'known-error': problems.filter((p) => p.currentStage === 'Known Error Review').length,
      'my-team': problems.filter((p) => p.team === 'Infrastructure' || p.team === 'Cloud Ops').length,
      resolved: problems.filter((p) => p.status === 'Resolved' || p.currentStage === 'Resolved').length,
    };
  }, [problems]);

  const totalCount = filteredProblems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, totalCount);
  const pagedProblems = filteredProblems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedProblem = useMemo(() => {
    if (!selectedProblemId) return null;
    return problems.find((p) => p.id === selectedProblemId || p.prefixId === selectedProblemId) || null;
  }, [problems, selectedProblemId]);

  const handleCreateProblem = (data: Partial<ProblemItem>) => {
    const created = problemsService.createProblem(data);
    setProblems(problemsService.getProblems());
    setSelectedProblemId(created.id);
  };

  const handleUpdateProblem = (updated: ProblemItem) => {
    problemsService.updateProblem(updated.id, updated);
    setProblems(problemsService.getProblems());
  };

  const handleAddLog = (author: string, content: string, type: any = 'note') => {
    if (!selectedProblemId) return;
    problemsService.addLogEntry(selectedProblemId, author, content, type);
    setProblems(problemsService.getProblems());
  };

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(pagedProblems.map((p) => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Team', 'Agent', 'Summary', 'Priority', 'Status', 'Category', 'Type'];
    const rows = filteredProblems.map((p) => [
      p.id,
      p.team,
      p.agent,
      `"${p.summary.replace(/"/g, '""')}"`,
      p.priority,
      p.status,
      p.category,
      p.type,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `problems_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMoreMenuOpen(false);
  };

  // If viewing a single problem's full detail console
  if (selectedProblem) {
    return (
      <div className="flex-1 w-full h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
        <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-30 min-h-[50px]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Service Desk</span>
            <span>/</span>
            <span className="text-gray-900">Problems</span>
          </div>
          <GlobalNavbarActions
            onGetStarted={() => {}}
            onNewTicket={() => setShowNewModal(true)}
            onOpenTicket={(id) => setSelectedProblemId(id)}
          />
        </header>

        <ProblemDetailView
          problem={selectedProblem}
          onBack={() => setSelectedProblemId(null)}
          onUpdateProblem={handleUpdateProblem}
          onAddLog={handleAddLog}
        />

        {showNewModal && (
          <NewProblemModal
            onClose={() => setShowNewModal(false)}
            onSubmit={handleCreateProblem}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* ── Top Header Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-30 min-h-[50px] sticky top-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Problems</span>
        </div>

        <GlobalNavbarActions
          onGetStarted={() => {}}
          onNewTicket={() => setShowNewModal(true)}
          onOpenTicket={(id) => setSelectedProblemId(id)}
        />
      </header>

      {/* ── Two-Column Body ── */}
      <div className="flex flex-1 h-full min-h-0 w-full overflow-hidden pt-3 px-[18px] pb-6 gap-4">
        {/* Left Sidebar */}
        <ProblemsSidebar
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          counts={sidebarCounts}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Right Main Table Panel */}
        <main className="flex-1 flex flex-col min-w-[340px] h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          {/* Main Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>Open Problems</span>
                <span className="text-slate-400 text-xs">▾</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Create a new problem"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 text-xs px-3 py-1.5 border border-slate-200 rounded-full focus:outline-none focus:border-[#eb6a47] text-slate-800"
                />
              </div>

              {/* Pagination controls */}
              <span className="text-xs font-medium text-slate-500">
                {pageStart}-{pageEnd} of {totalCount}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
                >
                  ›
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setProblems(problemsService.getProblems());
                }}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                title="Refresh list"
              >
                ↻
              </button>

              {/* + New Button */}
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#eb6a47] hover:bg-[#d65736] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <span>+</span>
                <span>New</span>
              </button>

              {/* More Actions Menu Button (···) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer"
                  title="More view options"
                >
                  ···
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('table');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <span>≡</span>
                      <span>Table View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('tile');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <span>☷</span>
                      <span>Tile View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('kanban');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <span>⊞</span>
                      <span>Kanban View</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <span>📄</span>
                      <span>Export to CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Table View Content ── */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'tile' ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pagedProblems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProblemId(p.id)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#eb6a47] bg-white hover:shadow-md transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">[{p.prefixId}]</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14532d] text-white">
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-2">{p.summary}</h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>{p.team}</span>
                      <span className="font-medium">{p.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'kanban' ? (
              <div className="p-4 grid grid-cols-4 gap-3 h-full">
                {['Investigation', 'Workaround', 'Known Error Review', 'Resolved'].map((col) => {
                  const colItems = pagedProblems.filter((p) => p.currentStage === col);
                  return (
                    <div key={col} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-700">{col}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-slate-500">
                          {colItems.length}
                        </span>
                      </div>
                      <div className="space-y-2 overflow-y-auto flex-1">
                        {colItems.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProblemId(p.id)}
                            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-[#eb6a47] shadow-2xs cursor-pointer text-xs space-y-1.5"
                          >
                            <span className="text-[10px] font-bold text-slate-400 block">{p.prefixId}</span>
                            <p className="font-bold text-slate-800 line-clamp-2">{p.summary}</p>
                            <span className="text-[10px] text-slate-500 block">{p.agent}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === pagedProblems.length && pagedProblems.length > 0}
                        onChange={handleSelectAllRows}
                        className="rounded border-slate-300 text-[#eb6a47] focus:ring-[#eb6a47]"
                      />
                    </th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Agent</th>
                    <th className="py-3 px-4 min-w-[280px]">Summary</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {pagedProblems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 italic">
                        No problems found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    pagedProblems.map((item) => {
                      const isSelected = selectedRows.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-orange-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(item.id)}
                              className="rounded border-slate-300 text-[#eb6a47] focus:ring-[#eb6a47]"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-600">{item.id}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{item.team}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#1e3a2f] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {item.agentInitials}
                              </span>
                              <span className="font-semibold text-slate-800 truncate">{item.agent}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedProblemId(item.id)}
                              className="text-left font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline cursor-pointer leading-relaxed"
                            >
                              {item.summary}
                            </button>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span
                                className={`w-2 h-2 rounded-xs shrink-0 ${
                                  item.priority === 'Critical'
                                    ? 'bg-red-600'
                                    : item.priority === 'High'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span>{item.priority}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14532d] text-white">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.category}</td>
                          <td className="py-3 px-4 font-medium text-slate-500 whitespace-nowrap">{item.type}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {showNewModal && (
        <NewProblemModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateProblem}
        />
      )}
    </div>
  );
};

export default ProblemsPage;
