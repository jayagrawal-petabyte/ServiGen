import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/shared/Pagination";
import SLAIndicator from "./SLAIndicator";
import PriorityIndicator from "./PriorityIndicator";
import { useAuth } from "../Auth/AuthContext";
import { MOCK_ORGANISATION_USERS } from "../Auth/mockAuthData";
import { usePersistentState } from "../../utils/persistentState";
import { TicketDetailModal, type TicketPriority } from "../../components/TicketDetailModal";
import { AgentKpiDrawer } from "../../components/shared/AgentKpiDrawer";
import { FeedPopover } from "../../components/shared/FeedPopover";
import { TimesheetPopover } from "../../components/shared/TimesheetPopover";
import "./TeamIncidents.css";
import {
  fetchSupportIncidents,
  fetchSupportAgents,
  updateSupportIncidentStatus,
} from "../../services/teamIncidentsService";

import { INITIAL_ALL_TEAM_INCIDENTS, type TeamIncident } from "./teamIncidents.data";

export type Incident = TeamIncident;

export type TeamViewSelection =
  | { kind: "team"; team: "1st Line Support" | "2nd Line Support" | "Infrastructure" }
  | { kind: "agent"; team: "1st Line Support" | "2nd Line Support" | "Infrastructure"; agent: string }
  | { kind: "breaching-sla" };

interface TeamIncidentTableProps {
  team?: string;
  mode?: string;
  initialViewKind?: "team" | "agent" | "breaching-sla";
}

const agents = MOCK_ORGANISATION_USERS.map((u) => u.fullName);

function TeamIncidentTable({
  team = "1st Line Support",
  initialViewKind,
}: TeamIncidentTableProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSecondLine = team.toLowerCase().includes("2nd");

  const [incidents, setIncidents] = usePersistentState<TeamIncident[]>(
    "servigen_all_team_incidents_v6",
    INITIAL_ALL_TEAM_INCIDENTS
  );

  const [agentsList, setAgentsList] = useState<string[]>(agents);
  const [isSyncingApi, setIsSyncingApi] = useState<boolean>(false);

  // Sync incidents and agents with live backend API
  useEffect(() => {
    let mounted = true;
    const targetTeam = isSecondLine ? "2nd Line Support" : "1st Line Support";
    setIsSyncingApi(true);

    fetchSupportIncidents(targetTeam)
      .then((res) => {
        if (mounted && res.incidents && res.incidents.length > 0) {
          setIncidents((prev) => {
            const newOnes = res.incidents.filter(
              (remote) => !prev.some((loc) => loc.id.toLowerCase() === remote.id.toLowerCase())
            );
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
          });
        }
      })
      .finally(() => {
        if (mounted) setIsSyncingApi(false);
      });

    fetchSupportAgents(targetTeam).then((agentList) => {
      if (mounted && agentList && agentList.length > 0) {
        const names = agentList
          .map((a) => `${a.firstName} ${a.lastName}`.trim())
          .filter(Boolean);
        setAgentsList((prev) => Array.from(new Set([...prev, ...names])));
      }
    });

    return () => {
      mounted = false;
    };
  }, [team, isSecondLine]);

  const [selectedView, setSelectedView] = useState<TeamViewSelection>(() => {
    if (initialViewKind === "breaching-sla") {
      return { kind: "breaching-sla" };
    }
    if (isSecondLine) {
      return { kind: "team", team: "2nd Line Support" };
    }
    return { kind: "team", team: "1st Line Support" };
  });

  const [search, setSearch] = useState("");
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Popover & Drawer States
  const [showKpiDrawer, setShowKpiDrawer] = useState(false);
  const [showFeedPopover, setShowFeedPopover] = useState(false);
  const [showTimesheetPopover, setShowTimesheetPopover] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Team Sidebar Navigation state
  const [firstLineExpanded, setFirstLineExpanded] = useState<boolean>(!isSecondLine);
  const [secondLineExpanded, setSecondLineExpanded] = useState<boolean>(isSecondLine);

  // Dynamic live counts for 1st Line Support (Sum = 37)
  const count1stLineTotal = React.useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support").length,
    [incidents]
  );
  const count1stLineUnassigned = React.useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support" && i.agent === "Unassigned").length,
    [incidents]
  );
  const count1stLineDemo = React.useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support" && i.agent === "Demo User").length,
    [incidents]
  );
  const count1stLineJames = React.useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support" && i.agent === "James Brown").length,
    [incidents]
  );
  const count1stLineJennifer = React.useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support" && i.agent === "Jennifer Williams").length,
    [incidents]
  );

  // Dynamic live counts for 2nd Line Support (Sum = 12)
  const count2ndLineTotal = React.useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support").length,
    [incidents]
  );
  const count2ndLineUnassigned = React.useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support" && i.agent === "Unassigned").length,
    [incidents]
  );
  const count2ndLineDemo = React.useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support" && i.agent === "Demo User").length,
    [incidents]
  );
  const count2ndLineDavid = React.useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support" && i.agent === "David Chen").length,
    [incidents]
  );
  const count2ndLineElena = React.useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support" && i.agent === "Elena Rostova").length,
    [incidents]
  );

  // Dynamic live counts for Infrastructure (Sum = 12)
  const countInfrastructure = React.useMemo(
    () => incidents.filter((i) => i.team === "Infrastructure").length,
    [incidents]
  );

  // Dynamic live counts for Breaching SLA (Sum = 61)
  const countBreachingSLA = React.useMemo(
    () => incidents.filter((i) => i.sla.startsWith("-")).length,
    [incidents]
  );

  // Reset page and selection when view or search changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIncidents([]);
  }, [selectedView, search]);

  // Get Started & New incident modals
  const [showGetStartedModal, setShowGetStartedModal] = useState<boolean>(false);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState<boolean>(false);
  const [newSummary, setNewSummary] = useState("");
  const [newCategory, setNewCategory] = useState(isSecondLine ? "Hardware>Workstation>Operating System" : "Network>VPN>Connectivity");
  const [newPriority, setNewPriority] = useState<string>("Medium");

  // Filtered incidents based on active sidebar view selection & search query
  const filteredIncidents = React.useMemo(() => {
    let base = incidents;
    if (selectedView.kind === "team") {
      base = incidents.filter((i) => i.team === selectedView.team);
    } else if (selectedView.kind === "agent") {
      base = incidents.filter(
        (i) => i.team === selectedView.team && i.agent === selectedView.agent
      );
    } else if (selectedView.kind === "breaching-sla") {
      base = incidents.filter((i) => i.sla.startsWith("-"));
    }

    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (incident) =>
        incident.id.toLowerCase().includes(q) ||
        incident.summary.toLowerCase().includes(q) ||
        incident.category.toLowerCase().includes(q) ||
        incident.agent.toLowerCase().includes(q)
    );
  }, [incidents, selectedView, search]);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const allFilteredSelected =
    paginatedIncidents.length > 0 &&
    paginatedIncidents.every((inc) => selectedIncidents.includes(inc.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIncidents((prev) =>
        prev.filter((id) => !paginatedIncidents.some((p) => p.id === id))
      );
    } else {
      const toAdd = paginatedIncidents
        .map((p) => p.id)
        .filter((id) => !selectedIncidents.includes(id));
      setSelectedIncidents((prev) => [...prev, ...toAdd]);
    }
  };

  const toggleIncidentSelection = (id: string) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssignToMe = () => {
    const myName = user?.fullName || "Inesh Agarwal";
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, agent: myName } : inc
      )
    );
    setSelectedIncidents([]);
  };

  const handleBulkSetPriority = (newPri: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, priority: newPri } : inc
      )
    );
  };

  const handleBulkSetStatus = (newStat: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        selectedIncidents.includes(inc.id) ? { ...inc, status: newStat } : inc
      )
    );
    // Push status changes to backend API
    selectedIncidents.forEach((id) => {
      updateSupportIncidentStatus(id, newStat);
    });
  };

  const handleCreateIncident = () => {
    if (!newSummary.trim()) return;
    const newId = `000${Math.floor(3900 + Math.random() * 99)}`;
    const targetTeam = selectedView.kind === "breaching-sla" ? "1st Line Support" : selectedView.team;
    const targetAgent = selectedView.kind === "agent" ? selectedView.agent : "Demo User";
    const newInc: Incident = {
      id: newId,
      sla: "-12:00",
      summary: newSummary,
      category: newCategory,
      agent: targetAgent,
      priority: newPriority,
      status: "In Progress",
      type: "Incident",
      team: targetTeam,
      dateLogged: "28/07/2026",
    };
    setIncidents((prev) => [newInc, ...prev]);
    setNewSummary("");
    setShowNewIncidentModal(false);
  };

  return (
    <div className="team-shell">
      {/* Top Navbar Header (Image 4 Match) */}
      <header className="team-top-navbar">
        <div className="team-breadcrumb">
          <span className="team-bc-link cursor-pointer hover:underline" onClick={() => navigate('/incidents')}>Incidents</span>
          <span className="team-bc-sep">›</span>
          {selectedView.kind === "breaching-sla" ? (
            <span className="team-bc-active font-semibold text-slate-800 flex items-center gap-1.5">
              <span style={{ fontSize: 13 }}>⏰</span> Breaching SLA
            </span>
          ) : (
            <>
              <span
                className="team-bc-link cursor-pointer hover:underline"
                onClick={() => setSelectedView({ kind: "team", team: selectedView.team })}
              >
                {selectedView.team}
              </span>
              {selectedView.kind === "agent" && (
                <>
                  <span className="team-bc-sep">›</span>
                  <span className="team-bc-active font-semibold text-slate-800">
                    {selectedView.agent}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <div className="team-header-actions">
          <button
            type="button"
            className="team-btn-get-started"
            onClick={() => setShowGetStartedModal(true)}
            title={`Get started with ${team} guide`}
          >
            Get started
          </button>
          <button
            type="button"
            className="team-btn-new-ticket"
            onClick={() => setShowNewIncidentModal(true)}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
            <span>New Ticket</span>
          </button>

          <div className="team-icon-buttons-group">
            {/* Search */}
            <button
              type="button"
              className="team-header-icon-btn"
              title="Search"
              onClick={() => {
                const el = document.getElementById("team-sidebar-search-input");
                el?.focus();
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="team-header-icon-btn"
              title="Notifications"
              onClick={() => alert("You have 3 unread team SLA alerts.")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Tasks / Clipboard */}
            <button
              type="button"
              className="team-header-icon-btn"
              title="Tasks"
              onClick={() => alert("Open assigned checklist tasks")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </button>

            {/* Compass / Performance */}
            <button
              type="button"
              className="team-header-icon-btn"
              title="Team SLA Performance"
              onClick={() => navigate('/reporting/incidents-by-category')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </button>

            {/* Broadcast Waves (Signal) -> Agent KPI Dashboard */}
            <button
              type="button"
              className={`team-header-icon-btn ${showKpiDrawer ? 'team-header-icon-active' : ''}`}
              title="Agent KPI Dashboard"
              onClick={() => {
                setShowTimesheetPopover(false);
                setShowFeedPopover(false);
                setShowKpiDrawer((p) => !p);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {/* Feed (Clock) Popover */}
            <button
              type="button"
              className={`team-header-icon-btn ${showFeedPopover ? 'team-header-icon-active' : ''}`}
              title="Live Activity Feed"
              onClick={() => {
                setShowTimesheetPopover(false);
                setShowKpiDrawer(false);
                setShowFeedPopover((p) => !p);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Help */}
            <button
              type="button"
              className="team-header-icon-btn"
              title={`${team} Guide & Help`}
              onClick={() => setShowGetStartedModal(true)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
            </button>

            {/* User Chat Bubble Avatar */}
            <button
              type="button"
              className="team-avatar-speech-btn"
              title={`Logged in as ${user?.fullName || "Demo User"}`}
              onClick={() => navigate('/my-work')}
            >
              <div className="team-avatar-speech-inner" />
              <span className="team-presence-green-dot" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Drawers & Popovers */}
      {showKpiDrawer && (
        <AgentKpiDrawer
          onClose={() => setShowKpiDrawer(false)}
          onOpenTicket={(id) => {
            const found = incidents.find((i) => i.id === id);
            if (found) setSelectedIncident(found);
            setShowKpiDrawer(false);
          }}
        />
      )}

      {showFeedPopover && (
        <FeedPopover
          onClose={() => setShowFeedPopover(false)}
          onOpenTicket={(id) => {
            const found = incidents.find((i) => i.id === id);
            if (found) setSelectedIncident(found);
            setShowFeedPopover(false);
          }}
        />
      )}

      {showTimesheetPopover && (
        <TimesheetPopover onClose={() => setShowTimesheetPopover(false)} />
      )}

      {/* Two-Column Body */}
      <div className="team-body-row">
        {/* Left Sidebar: Incidents by Team */}
        <aside className={`team-sidebar-panel ${isSidebarCollapsed ? "collapsed" : ""}`}>
          {/* Search */}
          <div className="team-sidebar-search">
            <input
              id="team-sidebar-search-input"
              type="text"
              placeholder="Search Incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#00bcd4" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Heading */}
          <div className="team-sidebar-header-row">
            <div className="team-sidebar-title-wrap">
              <div className="team-sidebar-title">
                <span style={{ fontSize: 15 }}>👥</span>
                <span>Incidents by Team</span>
              </div>
              <span className="team-sidebar-subtitle">▽ Open incidents</span>
            </div>
            <span
              className="collapse-arrow cursor-pointer select-none text-gray-500 hover:text-black font-bold"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? "»" : "«"}
            </span>
          </div>

          {/* Teams Navigation Tree */}
          <div className="team-sidebar-scroll">
            {/* 1st Line Support Group */}
            <div className="team-sidebar-section">
              <button
                type="button"
                className={`team-sidebar-group-header ${
                  selectedView.kind === "team" && selectedView.team === "1st Line Support"
                    ? "active-group"
                    : ""
                }`}
                onClick={() => {
                  setSelectedView({ kind: "team", team: "1st Line Support" });
                  setFirstLineExpanded(true);
                }}
                title="View all 37 incidents for 1st Line Support"
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ fontSize: 10, cursor: "pointer", padding: "2px 4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFirstLineExpanded(!firstLineExpanded);
                    }}
                    title="Toggle folder"
                  >
                    {firstLineExpanded ? "▼" : "►"}
                  </span>
                  <span style={{ fontWeight: 700 }}>1st Line Support</span>
                </div>
                <span className="team-sidebar-badge">{count1stLineTotal}</span>
              </button>

              {firstLineExpanded && (
                <div className="team-subitems-tree">
                  {/* Unassigned */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "1st Line Support" &&
                      selectedView.agent === "Unassigned"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "1st Line Support",
                        agent: "Unassigned",
                      })
                    }
                    title="View 13 unassigned tickets"
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#7c3aed", fontSize: 14 }}>👤</span>
                      <span>Unassigned</span>
                    </div>
                    <span className="team-sidebar-badge">{count1stLineUnassigned}</span>
                  </button>

                  {/* Available label */}
                  <span className="team-section-pill-label available">Available</span>

                  {/* Demo User (You) */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "1st Line Support" &&
                      selectedView.agent === "Demo User"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "1st Line Support",
                        agent: "Demo User",
                      })
                    }
                    title="View 4 tickets assigned to Demo User"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span style={{ color: "#22c55e", fontSize: 10 }}>🟢</span>
                      <span className="truncate">Demo User (You)</span>
                      <span>🏆</span>
                    </div>
                    <span className="team-sidebar-badge">{count1stLineDemo}</span>
                  </button>

                  {/* Offline label */}
                  <span className="team-section-pill-label offline">Offline</span>

                  {/* James Brown */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "1st Line Support" &&
                      selectedView.agent === "James Brown"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "1st Line Support",
                        agent: "James Brown",
                      })
                    }
                    title="View 10 tickets assigned to James Brown"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="team-avatar-initials">JB</span>
                      <span>James Brown</span>
                    </div>
                    <span className="team-sidebar-badge">{count1stLineJames}</span>
                  </button>

                  {/* Jennifer Williams */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "1st Line Support" &&
                      selectedView.agent === "Jennifer Williams"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "1st Line Support",
                        agent: "Jennifer Williams",
                      })
                    }
                    title="View 10 tickets assigned to Jennifer Williams"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="team-avatar-initials jw">JW</span>
                      <span>Jennifer Williams</span>
                    </div>
                    <span className="team-sidebar-badge">{count1stLineJennifer}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2nd Line Support Group */}
            <div className="team-sidebar-section">
              <button
                type="button"
                className={`team-sidebar-group-header ${
                  selectedView.kind === "team" && selectedView.team === "2nd Line Support"
                    ? "active-group"
                    : ""
                }`}
                onClick={() => {
                  setSelectedView({ kind: "team", team: "2nd Line Support" });
                  setSecondLineExpanded(true);
                }}
                title="View all 12 incidents for 2nd Line Support"
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ fontSize: 10, cursor: "pointer", padding: "2px 4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSecondLineExpanded(!secondLineExpanded);
                    }}
                    title="Toggle folder"
                  >
                    {secondLineExpanded ? "▼" : "►"}
                  </span>
                  <span style={{ fontWeight: 700 }}>2nd Line Support</span>
                </div>
                <span className="team-sidebar-badge">{count2ndLineTotal}</span>
              </button>

              {secondLineExpanded && (
                <div className="team-subitems-tree">
                  {/* Unassigned */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "2nd Line Support" &&
                      selectedView.agent === "Unassigned"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "2nd Line Support",
                        agent: "Unassigned",
                      })
                    }
                    title="View 2 unassigned tickets"
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#7c3aed", fontSize: 14 }}>👤</span>
                      <span>Unassigned</span>
                    </div>
                    <span className="team-sidebar-badge">{count2ndLineUnassigned}</span>
                  </button>

                  {/* Available label */}
                  <span className="team-section-pill-label available">Available</span>

                  {/* Demo User (You) */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "2nd Line Support" &&
                      selectedView.agent === "Demo User"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "2nd Line Support",
                        agent: "Demo User",
                      })
                    }
                    title="View 4 tickets assigned to Demo User"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span style={{ color: "#22c55e", fontSize: 10 }}>🟢</span>
                      <span className="truncate">Demo User (You)</span>
                      <span>🏆</span>
                    </div>
                    <span className="team-sidebar-badge">{count2ndLineDemo}</span>
                  </button>

                  {/* Offline label */}
                  <span className="team-section-pill-label offline">Offline</span>

                  {/* David Chen */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "2nd Line Support" &&
                      selectedView.agent === "David Chen"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "2nd Line Support",
                        agent: "David Chen",
                      })
                    }
                    title="View 3 tickets assigned to David Chen"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="team-avatar-initials">DC</span>
                      <span>David Chen</span>
                    </div>
                    <span className="team-sidebar-badge">{count2ndLineDavid}</span>
                  </button>

                  {/* Elena Rostova */}
                  <button
                    type="button"
                    className={`team-subitem-btn ${
                      selectedView.kind === "agent" &&
                      selectedView.team === "2nd Line Support" &&
                      selectedView.agent === "Elena Rostova"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedView({
                        kind: "agent",
                        team: "2nd Line Support",
                        agent: "Elena Rostova",
                      })
                    }
                    title="View 3 tickets assigned to Elena Rostova"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="team-avatar-initials jw">ER</span>
                      <span>Elena Rostova</span>
                    </div>
                    <span className="team-sidebar-badge">{count2ndLineElena}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Infrastructure Group */}
            <div className="team-sidebar-section">
              <button
                type="button"
                className={`team-sidebar-group-header ${
                  selectedView.kind === "team" && selectedView.team === "Infrastructure"
                    ? "active-group"
                    : ""
                }`}
                onClick={() =>
                  setSelectedView({ kind: "team", team: "Infrastructure" })
                }
                title="View all 12 Infrastructure tickets"
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10 }}>►</span>
                  <span style={{ fontWeight: 700 }}>Infrastructure</span>
                </div>
                <span className="team-sidebar-badge">{countInfrastructure}</span>
              </button>
            </div>

            {/* Breaching SLA */}
            <div className="team-sidebar-section" style={{ marginTop: 6 }}>
              <button
                type="button"
                className={`team-sidebar-breaching-sla ${
                  selectedView.kind === "breaching-sla" ? "active-group" : ""
                }`}
                onClick={() => setSelectedView({ kind: "breaching-sla" })}
                title="View all 61 Breaching SLA incidents across teams"
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14 }}>⏰</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>Breaching SLA</span>
                </div>
                <span className="team-sidebar-badge breaching">{countBreachingSLA}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Table Content */}
        <main className="team-main-content">
          {/* Table Toolbar */}
          <div className="team-table-toolbar-row">
            <div className="team-toolbar-left-group">
              <button
                type="button"
                className="team-toolbar-add-pill"
                title="Create Incident"
                onClick={() => setShowNewIncidentModal(true)}
              >
                +
              </button>
            </div>

            <div className="team-toolbar-right-group">
              <span className="team-count-display">
                {paginatedIncidents.length > 0
                  ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of ${filteredIncidents.length}`
                  : "0-0 of 0"}
              </span>

              <Pagination
                currentRange=""
                hasPrevious={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />

              <button
                type="button"
                className="tb-nav-btn"
                onClick={() => setSearch("")}
                title="Refresh table"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>

              <button
                type="button"
                className="team-btn-new-cyan"
                onClick={() => setShowNewIncidentModal(true)}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
                <span>New</span>
              </button>

              <button
                type="button"
                className="tb-nav-btn"
                title="More Options"
                onClick={() => alert("Batch table exports & view configuration")}
              >
                <span style={{ letterSpacing: "1px", fontWeight: "bold" }}>···</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar when checkboxes are checked */}
          {selectedIncidents.length > 0 && (
            <div className="tickets-bulk-actions-bar">
              <div className="bulk-selection-count">
                <span className="bulk-badge">{selectedIncidents.length}</span>
                <span>incident{selectedIncidents.length > 1 ? "s" : ""} selected</span>
              </div>

              <div className="bulk-actions-buttons">
                <button
                  type="button"
                  className="bulk-btn bulk-btn-assign"
                  onClick={handleBulkAssignToMe}
                  title={`Assign selected incidents to ${user?.fullName || "Inesh Agarwal"}`}
                >
                  Assign to Me
                </button>

                <div className="bulk-priority-dropdown-wrap">
                  <select
                    className="bulk-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetPriority(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    aria-label="Set priority"
                  >
                    <option value="" disabled>Set Priority ▾</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="bulk-priority-dropdown-wrap">
                  <select
                    className="bulk-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkSetStatus(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    aria-label="Set status"
                  >
                    <option value="" disabled>Set Status ▾</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Open">Open</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="bulk-btn bulk-btn-clear"
                  onClick={() => setSelectedIncidents([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="incident-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="incident-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all incidents"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ width: 70 }}>Viewing</th>
                  <th style={{ width: 90 }}>ID</th>
                  <th style={{ width: 120 }}>SLA Time Left</th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.length > 0 ? (
                  paginatedIncidents.map((incident) => {
                    const isSelected = selectedIncidents.includes(incident.id);
                    return (
                      <tr
                        key={incident.id}
                        className={selectedIncident?.id === incident.id ? "row-viewing-active" : isSelected ? "selected" : ""}
                        onClick={() => setSelectedIncident(incident)}
                        style={{ cursor: "pointer" }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleIncidentSelection(incident.id)}
                          />
                        </td>
                        <td>
                          {incident.isStarred ? (
                            <span className="star-indicator" title="Starred / Flagged">⭐</span>
                          ) : (
                            <span className="viewing-dash">—</span>
                          )}
                        </td>
                        <td className="font-bold text-gray-900">
                          {incident.id}
                        </td>
                        <td>
                          <span className="sla-bar-red">{incident.sla}</span>
                        </td>
                        <td className="team-table-summary-link font-medium">
                          {incident.summary}
                        </td>
                        <td className="text-gray-600 text-xs">
                          {incident.category}
                        </td>
                        <td>
                          <PriorityIndicator priority={incident.priority} />
                        </td>
                        <td>
                          <span
                            className={
                              incident.status.toLowerCase() === "new"
                                ? "status-pill-new"
                                : incident.status.toLowerCase() === "in progress"
                                ? "status-pill-in-progress"
                                : incident.status.toLowerCase() === "on hold"
                                ? "status-pill-on-hold"
                                : "status-pill-resolved"
                            }
                          >
                            {incident.status}
                          </span>
                        </td>
                        <td className="text-gray-600 text-xs">
                          {incident.type}
                        </td>
                        <td className="text-gray-500 text-xs">
                          {incident.dateLogged || "28/07/2026"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="empty-state text-center py-8 text-gray-500">
                      No incidents found matching the current view or search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Ticket Detail Modal */}
      {selectedIncident && (
        <TicketDetailModal
          ticket={{
            id: selectedIncident.id,
            type: selectedIncident.type,
            summary: selectedIncident.summary,
            agent: selectedIncident.agent,
            priority: (selectedIncident.priority as TicketPriority) || "Medium",
            status: selectedIncident.status,
            category: selectedIncident.category,
            targetSla: `Target SLA: ${selectedIncident.sla}`,
          }}
          currentUser={user?.fullName || "Inesh Agarwal"}
          onClose={() => setSelectedIncident(null)}
          onUpdateTicket={(updated) => {
            setIncidents((prev) =>
              prev.map((i) =>
                i.id === updated.id
                  ? {
                      ...i,
                      status: updated.status || i.status,
                      priority: (updated.priority as any) || i.priority,
                      category: updated.category || i.category,
                      agent: updated.agent || i.agent,
                    }
                  : i
              )
            );
          }}
        />
      )}

      {/* New Incident Modal */}
      {showNewIncidentModal && (
        <div className="new-incident-modal-backdrop" onClick={() => setShowNewIncidentModal(false)}>
          <div className="new-incident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="new-incident-modal-header">
              <h2>Log New Incident</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowNewIncidentModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="new-incident-modal-body">
              <label htmlFor="inc-summary">Summary</label>
              <input
                id="inc-summary"
                type="text"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Brief description of the incident..."
                autoFocus
              />

              <label htmlFor="inc-cat">Category</label>
              <select
                id="inc-cat"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Office Applications>Microsoft 365">Office Applications &gt; Microsoft 365</option>
                <option value="Collaboration Tools>Zoom/Teams">Collaboration Tools &gt; Zoom/Teams</option>
                <option value="Security>Password Management">Security &gt; Password Management</option>
                <option value="Network>VPN>Connectivity">Network &gt; VPN &gt; Connectivity</option>
              </select>

              <label htmlFor="inc-pri">Priority</label>
              <select
                id="inc-pri"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="new-incident-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowNewIncidentModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="create-incident-button"
                onClick={handleCreateIncident}
              >
                Log Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Get Started Guide Modal */}
      {showGetStartedModal && (
        <div className="new-incident-modal-backdrop" onClick={() => setShowGetStartedModal(false)}>
          <div className="team-get-started-modal" onClick={(e) => e.stopPropagation()}>
            <div className="team-get-started-header">
              <div className="team-get-started-title-row">
                <span style={{ fontSize: 18 }}>🚀</span>
                <h2>{team} — Incident Management Guide</h2>
              </div>
              <button
                type="button"
                className="team-get-started-close"
                onClick={() => setShowGetStartedModal(false)}
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>

            <div className="team-get-started-body">
              <div className="team-guide-banner">
                <span className="team-guide-banner-title">
                  <span>📌</span>
                  <span>{isSecondLine ? "2nd Line Technical Support Hub" : "1st Line Help Desk Operations"}</span>
                </span>
                <span className="team-guide-banner-desc">
                  {isSecondLine
                    ? "2nd Line Support manages escalated and complex incident tickets requiring root-cause diagnostics, hardware firmware repairs, network infrastructure triage, and advanced configuration fixes."
                    : "1st Line Support handles primary incident intake, first-contact resolution, account provisioning, triage verification, and routing tickets to specialist engineering pods."}
                </span>
              </div>

              <div className="team-guide-section">
                <h3 className="team-guide-section-title">Essential Workflows & Tools</h3>

                <div className="team-guide-feature-card">
                  <span className="team-guide-feature-icon">🔍</span>
                  <div className="team-guide-feature-info">
                    <span className="team-guide-feature-name">Full Ticket Screen Inspection</span>
                    <span className="team-guide-feature-desc">
                      Click any incident row or ticket ID to open the full ticket screen complete with Progress, Details, View Log, and Notification Log.
                    </span>
                  </div>
                </div>

                <div className="team-guide-feature-card">
                  <span className="team-guide-feature-icon">⚡</span>
                  <div className="team-guide-feature-info">
                    <span className="team-guide-feature-name">Bulk Agent Assignment & Priority Updates</span>
                    <span className="team-guide-feature-desc">
                      Check multiple ticket checkboxes to activate bulk operations. Assign tickets to yourself, adjust priority tiers, or advance statuses with a single click.
                    </span>
                  </div>
                </div>

                <div className="team-guide-feature-card">
                  <span className="team-guide-feature-icon">➕</span>
                  <div className="team-guide-feature-info">
                    <span className="team-guide-feature-name">Log New Incident / Escalation</span>
                    <span className="team-guide-feature-desc">
                      Use the <strong>+ New Ticket</strong> button in the top navbar to log fresh technical issues directly into {selectedView.kind === "agent" ? selectedView.agent : selectedView.kind === "team" ? selectedView.team : "Breaching SLA Queue"}.
                    </span>
                  </div>
                </div>

                <div className="team-guide-feature-card">
                  <span className="team-guide-feature-icon">📊</span>
                  <div className="team-guide-feature-info">
                    <span className="team-guide-feature-name">Real-time KPI & Activity Drawers</span>
                    <span className="team-guide-feature-desc">
                      Click the broadcast icon to view the Agent KPI Dashboard, the clock icon for the live Feed, or the compass for SLA performance analytics.
                    </span>
                  </div>
                </div>
              </div>

              <div className="team-guide-section">
                <h3 className="team-guide-section-title">Support Teams Navigation</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="team-subitem-btn"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: !isSecondLine ? "#e0f2fe" : "#ffffff" }}
                    onClick={() => {
                      setShowGetStartedModal(false);
                      navigate('/team/1st-line-live');
                    }}
                  >
                    <span>👥 1st Line Support</span>
                  </button>
                  <button
                    type="button"
                    className="team-subitem-btn"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: isSecondLine ? "#e0f2fe" : "#ffffff" }}
                    onClick={() => {
                      setShowGetStartedModal(false);
                      navigate('/team/2nd-line-live');
                    }}
                  >
                    <span>👥 2nd Line Support</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="team-get-started-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowGetStartedModal(false);
                  setShowNewIncidentModal(true);
                }}
              >
                + Log New Ticket
              </button>
              <button
                type="button"
                className="create-incident-button"
                onClick={() => setShowGetStartedModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamIncidentTable;