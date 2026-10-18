import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import NewIncidentModal from './components/NewIncidentModal';
import { GlobalNavbarActions } from '../../components/shared/GlobalNavbarActions';
import { majorIncidentsService } from '../../services/majorIncidentsService';
import type { MajorIncident } from './types/majorIncident.types';

const SCR021_MajorIncidentsDesign: React.FC = () => {
  const navigate = useNavigate();
  const [selectedListId, setSelectedListId] = useState<string>('update-required');
  const [allIncidents, setAllIncidents] = useState<MajorIncident[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 4;

  const loadIncidents = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const live = await majorIncidentsService.getMajorIncidents();
      if (Array.isArray(live)) {
        setAllIncidents(live);
      }
    } catch {
      // Keep existing incidents on error
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Filter based on selected list category and search query
  const filteredIncidents = useMemo(() => {
    let result = allIncidents;
    if (selectedListId === 'update-required') {
      result = result.filter((i) => !i.lifecycleStages[5]?.isCompleted);
    } else if (selectedListId === 'critical') {
      result = result.filter((i) => i.priority === 'Critical');
    } else if (selectedListId === 'my-team') {
      result = result.filter((i) => i.assignee !== 'Unassigned');
    } else if (selectedListId === 'closed') {
      result = result.filter((i) => i.lifecycleStages[5]?.isCompleted);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.product.toLowerCase().includes(q) ||
          i.assignee.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allIncidents, selectedListId, searchQuery]);

  const totalCount = filteredIncidents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const pagedIncidents = filteredIncidents.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCreateTicket = (newInc: MajorIncident) => {
    setAllIncidents((prev) => [newInc, ...prev]);
    setShowNewModal(false);
    majorIncidentsService.createMajorIncident({
      title: newInc.title,
      priority: newInc.priority,
      product: newInc.product,
      assignee: newInc.assignee,
    }).then((created) => {
      if (created) {
        setAllIncidents((prev) => prev.map((i) => i.id === newInc.id ? created : i));
      }
    }).catch(() => {});
    navigate(`/major-incidents/live?incident=${newInc.id}`);
  };

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-gray-100 overflow-hidden font-sans relative">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shrink-0 min-h-[50px] w-full z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Major Incidents</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input (Expandable) */}
          {isSearchOpen && (
            <div className="relative flex items-center animate-fadeIn">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search incidents, ID, service..."
                className="w-56 text-xs pl-7 pr-7 py-1.5 border border-[#f8c5b1] rounded-full outline-none focus:ring-1 focus:ring-[#eb6a47] bg-white"
                autoFocus
              />
              <span className="absolute left-2.5 text-gray-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <GlobalNavbarActions onNewTicket={() => setShowNewModal(true)} />
        </div>
      </header>

      {/* ── Main Layout (Sidebar + Content) ── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <MajorIncidentsSidebar
          onSelectList={(id) => {
            setSelectedListId(id);
            setPage(1);
          }}
        />

        {/* Workspace Area (List) */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="w-8 h-8 rounded-full border border-[#eb6a47] text-[#eb6a47] flex items-center justify-center bg-white hover:bg-[#fdede7] transition-colors cursor-pointer"
                title="Create New Major Incident"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <div className="flex items-center gap-4 text-sm text-gray-600 relative">
                <span className="font-medium text-xs text-gray-700">
                  {totalCount === 0 ? '0' : `${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, totalCount)}`} of{' '}
                  {totalCount}
                </span>

                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={activePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Previous page"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    disabled={activePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Next page"
                  >
                    &gt;
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadIncidents}
                  className="p-1 text-[#eb6a47] hover:bg-[#fdede7] flex items-center justify-center rounded cursor-pointer transition-colors"
                  title="Refresh incident list"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="bg-[#eb6a47] hover:bg-[#db5936] text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1 cursor-pointer transition-colors active:scale-95 text-xs"
                >
                  <span>+</span> New
                </button>

                {/* More Options Dropdown */}
                <button
                  type="button"
                  onClick={() => setShowOptionsMenu((o) => !o)}
                  className="p-1 hover:bg-gray-200 rounded cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
                  title="More connected views"
                >
                  •••
                </button>

                {showOptionsMenu && (
                  <div className="absolute right-0 top-9 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Connected Modules &amp; Views
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/reports/incidents-by-category');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📊</span> Incidents by Category Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/change-requests');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>🔧</span> Change Requests &amp; RCA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/cmdb/services');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚙️</span> CMDB Topology &amp; Services
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/calendar');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📅</span> Major Incident Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/major-incidents/list');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📋</span> Major Incident Register (List View)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/major-incidents/feed');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fdede7] text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📡</span> Major Incident Feed View
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {pagedIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <span className="text-3xl mb-2">🔍</span>
                  <p className="text-sm font-medium">No major incidents match the current criteria</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedListId('all');
                    }}
                    className="mt-3 text-xs text-[#eb6a47] hover:underline font-semibold cursor-pointer"
                  >
                    Clear filters &amp; view all
                  </button>
                </div>
              ) : (
                pagedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => navigate(`/major-incidents/live?incident=${incident.id}`)}
                  />
                ))
              )}
            </div>
          </main>
        </div>

      {/* Floating Modals and Panels */}
      {showNewModal && (
        <NewIncidentModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateTicket}
        />
      )}
    </div>
  );
};

export default SCR021_MajorIncidentsDesign;
