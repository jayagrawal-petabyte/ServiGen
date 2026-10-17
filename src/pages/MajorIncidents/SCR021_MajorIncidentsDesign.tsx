import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MajorIncidentsSidebar from './components/MajorIncidentsSidebar';
import IncidentCard from './components/IncidentCard';
import NewIncidentModal from './components/NewIncidentModal';
import { AgentKpiDrawer } from '../../components/shared/AgentKpiDrawer';
import { FeedPopover } from '../../components/shared/FeedPopover';
import { TimesheetPopover } from '../../components/shared/TimesheetPopover';
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
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isKpiDrawerOpen, setIsKpiDrawerOpen] = useState<boolean>(false);
  const [isFeedPopoverOpen, setIsFeedPopoverOpen] = useState<boolean>(false);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState<boolean>(false);
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
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      {/* ── Main Layout (Sidebar + Header + Content) ── */}
      <MajorIncidentsSidebar
        onSelectList={(id) => {
          setSelectedListId(id);
          setPage(1);
        }}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              onClick={() => navigate('/major-incidents/live')}
              className="cursor-pointer hover:text-cyan-600 transition-colors"
            >
              Major Incidents
            </span>
            <span className="text-gray-400">&gt;</span>
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              Update Required (Design Preview)
            </div>
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
                  className="w-56 text-xs pl-7 pr-7 py-1.5 border border-cyan-400 rounded-full outline-none focus:ring-1 focus:ring-cyan-300 bg-white"
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

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="bg-cyan-400 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            >
              <span className="text-lg leading-none">+</span> New Ticket
            </button>

            {/* Icon Group */}
            <div className="flex items-center gap-1.5 ml-1">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer transition-colors ${
                  isSearchOpen ? 'border-cyan-400 text-cyan-500' : ''
                }`}
                title="Search Major Incidents"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Bell with badge */}
              <button
                type="button"
                onClick={() => setShowNotifPopover((p) => !p)}
                className="relative w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer"
                title="Active Alerts & Notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  1
                </div>
              </button>

              {/* Clipboard (My Work Queue) */}
              <button
                type="button"
                onClick={() => navigate('/my-work')}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer"
                title="My Work Tasks & Queue"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>

              {/* Speedometer -> Timesheet */}
              <button
                type="button"
                onClick={() => {
                  setIsFeedPopoverOpen(false);
                  setIsKpiDrawerOpen(false);
                  setIsTimesheetOpen((t) => !t);
                }}
                className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer ${isTimesheetOpen ? 'bg-cyan-50 border-cyan-400 text-cyan-600' : ''}`}
                title="Timesheet & Logged Hours"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l3.5-3.5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </button>

              {/* RSS/Wifi -> Agent KPI Dashboard (Image 1) */}
              <button
                type="button"
                onClick={() => {
                  setIsFeedPopoverOpen(false);
                  setIsTimesheetOpen(false);
                  setIsKpiDrawerOpen((k) => !k);
                }}
                className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer ${isKpiDrawerOpen ? 'bg-cyan-50 border-cyan-400 text-cyan-600' : ''}`}
                title="Agent KPI Dashboard"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>

              {/* Clock -> Live Activity Feed (Image 2) */}
              <button
                type="button"
                onClick={() => {
                  setIsTimesheetOpen(false);
                  setIsKpiDrawerOpen(false);
                  setIsFeedPopoverOpen((p) => !p);
                }}
                className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer ${isFeedPopoverOpen ? 'bg-cyan-50 border-cyan-400 text-cyan-600' : ''}`}
                title="Live Activity Feed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Question (Help) */}
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white shadow-sm cursor-pointer"
                title="Help & Shortcuts"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Profile Avatar */}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="relative w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-white ml-1 cursor-pointer hover:bg-cyan-500 transition-colors"
                title="User Profile & Settings"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.76 1.49 5.2 3.8 6.78V21.5a.5.5 0 00.78.41l3.52-2.3c1.23.25 2.53.39 3.9.39 5.52 0 10-3.92 10-8.75S17.52 2 12 2z" />
                </svg>
                <div className="absolute bottom-0 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Notifications Popover */}
        {showNotifPopover && (
          <div className="absolute right-6 top-14 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-semibold text-gray-800 text-sm">Active Notifications</span>
              <button
                type="button"
                onClick={() => setShowNotifPopover(false)}
                className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-3 flex flex-col gap-2.5">
              <div
                onClick={() => {
                  setShowNotifPopover(false);
                  navigate('/major-incidents/live?incident=0002673');
                }}
                className="p-2.5 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-red-800">
                  <span>Critical Escalation</span>
                  <span className="text-[10px] text-red-600">Now</span>
                </div>
                <p className="text-xs text-red-700 mt-1">Incident #0002673: SLA target at 82% threshold</p>
              </div>
              <div
                onClick={() => {
                  setShowNotifPopover(false);
                  navigate('/change-requests');
                }}
                className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg cursor-pointer hover:bg-cyan-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-800">
                  <span>Change Request</span>
                  <span className="text-[10px] text-cyan-600">10m ago</span>
                </div>
                <p className="text-xs text-cyan-700 mt-1">Emergency change RFC-000412 pending approval</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNotifPopover(false);
                navigate('/major-incidents/live');
              }}
              className="w-full mt-2 py-1.5 text-xs text-center text-cyan-700 font-semibold bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Open Full Notification Center →
            </button>
          </div>
        )}

        {/* Workspace Area (List) */}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="w-8 h-8 rounded-full border border-cyan-400 text-cyan-400 flex items-center justify-center bg-white hover:bg-cyan-50 transition-colors cursor-pointer"
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
                  className="p-1 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center rounded cursor-pointer transition-colors"
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
                  className="bg-cyan-400 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1 cursor-pointer transition-colors active:scale-95 text-xs"
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
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📊</span> Incidents by Category Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/change-requests');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>🔧</span> Change Requests &amp; RCA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/cmdb/services');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚙️</span> CMDB Topology &amp; Services
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/calendar');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📅</span> Major Incident Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/major-incidents/list');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <span>📋</span> Major Incident Register (List View)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/major-incidents/feed');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-gray-700 font-medium flex items-center gap-2 cursor-pointer"
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
                    className="mt-3 text-xs text-cyan-600 hover:underline font-semibold cursor-pointer"
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
      </div>

      {/* Floating Modals and Panels */}
      {showNewModal && (
        <NewIncidentModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateTicket}
        />
      )}

      {isKpiDrawerOpen && (
        <AgentKpiDrawer
          onClose={() => setIsKpiDrawerOpen(false)}
          onOpenTicket={(id) => {
            setIsKpiDrawerOpen(false);
            navigate(`/major-incidents/live?incident=${id}`);
          }}
        />
      )}

      {isFeedPopoverOpen && (
        <FeedPopover
          onClose={() => setIsFeedPopoverOpen(false)}
          onOpenTicket={(id) => {
            setIsFeedPopoverOpen(false);
            navigate(`/major-incidents/live?incident=${id}`);
          }}
        />
      )}

      {isTimesheetOpen && (
        <TimesheetPopover onClose={() => setIsTimesheetOpen(false)} />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Major Incident Console Help</h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-4 text-xs text-gray-600 space-y-3">
              <p>
                <strong>Navigation:</strong> Click any incident card to jump directly into the full war room console with stage tracking, technical checklists, and impact assessments.
              </p>
              <p>
                <strong>Connected Modules:</strong> Use the ••• menu to reach CMDB Services, Change Requests, Calendar, and the Category Report.
              </p>
              <p>
                <strong>Shortcuts:</strong> Press <code className="bg-gray-100 px-1 py-0.5 rounded">Esc</code> to close active dialogs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-cyan-500 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-3">
              IA
            </div>
            <h3 className="font-bold text-gray-900 text-base">Inesh Agarwal</h3>
            <p className="text-xs text-gray-500">Major Incident Commander (Admin)</p>
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-left space-y-2 text-gray-600">
              <div><strong>Email:</strong> inesh@servigen.io</div>
              <div><strong>Role:</strong> Administrator</div>
              <div><strong>Primary Site:</strong> Site 2 (EMEA Core)</div>
            </div>
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SCR021_MajorIncidentsDesign;
