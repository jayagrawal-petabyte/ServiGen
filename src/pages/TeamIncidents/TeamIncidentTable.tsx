import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/shared/Pagination";
import PriorityIndicator from "./PriorityIndicator";
import { useAuth } from "../Auth/AuthContext";
import { TicketDetailModal, type TicketPriority } from "../../components/TicketDetailModal";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import "./TeamIncidents.css";
import {
  fetchAllTeamIncidents,
  updateSupportIncidentStatus,
  type SupportAgent,
} from "../../services/teamIncidentsService";

import type { TeamIncident } from "./teamIncidents.data";

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

function TeamIncidentTable({
  team = "1st Line Support",
  initialViewKind,
}: TeamIncidentTableProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSecondLine = team.toLowerCase().includes("2nd");

  const [incidents, setIncidents] = useState<TeamIncident[]>([]);
  const [firstLineAgents, setFirstLineAgents] = useState<SupportAgent[]>([]);
  const [secondLineAgents, setSecondLineAgents] = useState<SupportAgent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync incidents and agents with live backend API
  useEffect(() => {
    // Clear legacy localStorage cached mock data
    try {
      localStorage.removeItem("servigen_all_team_incidents_v6");
      localStorage.removeItem("servigen_all_team_incidents_v5");
    } catch {
      // ignore
    }

    let mounted = true;
    setIsLoading(true);

    fetchAllTeamIncidents()
      .then((res) => {
        if (mounted) {
          setIncidents(res.incidents);
          setFirstLineAgents(res.firstLineAgents);
          setSecondLineAgents(res.secondLineAgents);
        }
      })
      .catch((err) => {
        console.error("[TeamIncidentTable] Live API fetch failed:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [team]);

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Open incidents");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<boolean>(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [isTableMenuOpen, setIsTableMenuOpen] = useState<boolean>(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setIsTableMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Team Sidebar Navigation state
  const [firstLineExpanded, setFirstLineExpanded] = useState<boolean>(!isSecondLine);
  const [secondLineExpanded, setSecondLineExpanded] = useState<boolean>(isSecondLine);

  // Dynamic live agent lists
  const firstLineAgentNames = useMemo(() => {
    const fromRoster = firstLineAgents.map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean);
    const fromIncidents = incidents
      .filter((i) => i.team === "1st Line Support" && i.agent && i.agent !== "Unassigned")
      .map((i) => i.agent);
    return Array.from(new Set([...fromRoster, ...fromIncidents]));
  }, [firstLineAgents, incidents]);

  const secondLineAgentNames = useMemo(() => {
    const fromRoster = secondLineAgents.map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean);
    const fromIncidents = incidents
      .filter((i) => i.team === "2nd Line Support" && i.agent && i.agent !== "Unassigned")
      .map((i) => i.agent);
    return Array.from(new Set([...fromRoster, ...fromIncidents]));
  }, [secondLineAgents, incidents]);

  // Dynamic live counts for 1st Line Support
  const count1stLineTotal = useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support").length,
    [incidents]
  );
  const count1stLineUnassigned = useMemo(
    () => incidents.filter((i) => i.team === "1st Line Support" && (!i.agent || i.agent === "Unassigned")).length,
    [incidents]
  );

  // Dynamic live counts for 2nd Line Support
  const count2ndLineTotal = useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support").length,
    [incidents]
  );
  const count2ndLineUnassigned = useMemo(
    () => incidents.filter((i) => i.team === "2nd Line Support" && (!i.agent || i.agent === "Unassigned")).length,
    [incidents]
  );

  // Dynamic live counts for Infrastructure
  const countInfrastructure = useMemo(
    () => incidents.filter((i) => i.team === "Infrastructure").length,
    [incidents]
  );

  // Dynamic live counts for Breaching SLA
  const countBreachingSLA = useMemo(
    () => incidents.filter((i) => i.sla.startsWith("-") || i.sla.toLowerCase().includes("breach")).length,
    [incidents]
  );

  // Reset page and selection when view, search, or status filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIncidents([]);
  }, [selectedView, search, statusFilter]);

  // Get Started & New incident modals
  const [showGetStartedModal, setShowGetStartedModal] = useState<boolean>(false);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState<boolean>(false);
  const [newSummary, setNewSummary] = useState("");
  const [newCategory, setNewCategory] = useState(isSecondLine ? "Hardware>Workstation>Operating System" : "Network>VPN>Connectivity");
  const [newPriority, setNewPriority] = useState<string>("Medium");

  // Filtered incidents based on active sidebar view selection, status filter & search query
  const filteredIncidents = useMemo(() => {
    let base = incidents;

    // View filter
    if (selectedView.kind === "team") {
      base = incidents.filter((i) => i.team === selectedView.team);
    } else if (selectedView.kind === "agent") {
      if (selectedView.agent === "Unassigned") {
        base = incidents.filter(
          (i) => i.team === selectedView.team && (!i.agent || i.agent === "Unassigned")
        );
      } else {
        base = incidents.filter(
          (i) => i.team === selectedView.team && i.agent.toLowerCase() === selectedView.agent.toLowerCase()
        );
      }
    } else if (selectedView.kind === "breaching-sla") {
      base = incidents.filter((i) => i.sla.startsWith("-") || i.sla.toLowerCase().includes("breach"));
    }

    // Status filter
    if (statusFilter === "Open incidents") {
      base = base.filter((i) => i.status !== "Resolved" && i.status !== "Closed");
    } else if (statusFilter === "In Progress") {
      base = base.filter((i) => i.status === "In Progress" || i.status === "Active");
    } else if (statusFilter === "New / Unassigned") {
      base = base.filter((i) => i.status === "New" || !i.agent || i.agent === "Unassigned");
    } else if (statusFilter === "Breaching SLA") {
      base = base.filter((i) => i.sla.startsWith("-") || i.sla.toLowerCase().includes("breach"));
    } else if (statusFilter === "Resolved / Closed") {
      base = base.filter((i) => i.status === "Resolved" || i.status === "Closed");
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
  }, [incidents, selectedView, statusFilter, search]);

  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) return;
    const headers = ["ID", "Priority", "Summary", "Category", "Agent", "Team", "Status", "SLA", "Date Logged"];
    const rows = filteredIncidents.map((i) => [
      i.id,
      i.priority,
      `"${(i.summary || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      i.agent,
      i.team,
      i.status,
      i.sla,
      i.dateLogged,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    // Push status updates to backend API
    selectedIncidents.forEach((id) => {
      updateSupportIncidentStatus(id, newStat);
    });
  };

  const handleCreateIncident = () => {
    if (!newSummary.trim()) return;
    const newId = `INC-${Math.floor(2000 + Math.random() * 8000)}`;
    const targetTeam = selectedView.kind === "breaching-sla" ? "1st Line Support" : selectedView.team;
    const targetAgent = selectedView.kind === "agent" ? selectedView.agent : (user?.fullName || "Unassigned");
    const newInc: Incident = {
      id: newId,
      sla: "-12:00",
      summary: newSummary,
      category: newCategory,
      agent: targetAgent,
      priority: newPriority,
      status: "Active",
      type: "Incident",
      team: targetTeam,
      dateLogged: new Date().toLocaleDateString("en-GB"),
    };
    setIncidents((prev) => [newInc, ...prev]);
    setNewSummary("");
    setShowNewIncidentModal(false);
  };

  return (
    <div className="team-shell">
      {/* Top Navbar Header */}
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
          <GlobalNavbarActions
            onGetStarted={() => setShowGetStartedModal(true)}
            onNewTicket={() => setShowNewIncidentModal(true)}
            onOpenTicket={(id) => {
              const found = incidents.find((i) => i.id === id);
              if (found) setSelectedIncident(found);
            }}
          />
        </div>
      </header>

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
            {search ? (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#00bcd4" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </div>

          {/* Heading */}
          <div className="team-sidebar-header-row">
            <div className="team-sidebar-title-wrap">
              <div
                className="team-sidebar-title cursor-pointer hover:text-cyan-600 transition-colors"
                onClick={() => {
                  setSelectedView({ kind: "team", team: isSecondLine ? "2nd Line Support" : "1st Line Support" });
                  setStatusFilter("Open incidents");
                }}
                title="Reset to team open incidents"
              >
                <span style={{ fontSize: 15 }}>👥</span>
                <span>Incidents by Team</span>
              </div>
              <div className="team-status-menu-container" ref={statusMenuRef}>
                <button
                  type="button"
                  className="team-sidebar-subtitle-btn"
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  title="Click to filter by status"
                >
                  <span className="dropdown-caret">{isStatusMenuOpen ? "▴" : "▾"}</span>
                  <span className="subtitle-text">{statusFilter}</span>
                </button>
                {isStatusMenuOpen && (
                  <div className="team-status-dropdown-menu animate-fadeIn">
                    {[
                      "Open incidents",
                      "All incidents",
                      "In Progress",
                      "New / Unassigned",
                      "Breaching SLA",
                      "Resolved / Closed",
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`team-status-dropdown-item ${statusFilter === opt ? "active" : ""}`}
                        onClick={() => {
                          setStatusFilter(opt);
                          setIsStatusMenuOpen(false);
                        }}
                      >
                        <span className="dropdown-check">{statusFilter === opt ? "✓" : ""}</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="collapse-arrow cursor-pointer select-none text-gray-500 hover:text-black font-bold p-1 rounded hover:bg-slate-100 transition-colors border-0 bg-transparent"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? "»" : "«"}
            </button>
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
                title={`View all ${count1stLineTotal} incidents for 1st Line Support`}
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
                    title={`View ${count1stLineUnassigned} unassigned tickets`}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#7c3aed", fontSize: 14 }}>👤</span>
                      <span>Unassigned</span>
                    </div>
                    <span className="team-sidebar-badge">{count1stLineUnassigned}</span>
                  </button>

                  {/* Dynamic 1st Line Agents */}
                  {firstLineAgentNames.length > 0 && (
                    <>
                      <span className="team-section-pill-label available">Support Agents</span>
                      {firstLineAgentNames.map((agentName) => {
                        const count = incidents.filter(
                          (i) => i.team === "1st Line Support" && i.agent.toLowerCase() === agentName.toLowerCase()
                        ).length;
                        const isMe = user?.fullName && user.fullName.toLowerCase() === agentName.toLowerCase();
                        const initials = agentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <button
                            key={agentName}
                            type="button"
                            className={`team-subitem-btn ${
                              selectedView.kind === "agent" &&
                              selectedView.team === "1st Line Support" &&
                              selectedView.agent.toLowerCase() === agentName.toLowerCase()
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedView({
                                kind: "agent",
                                team: "1st Line Support",
                                agent: agentName,
                              })
                            }
                            title={`View ${count} tickets assigned to ${agentName}`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="team-avatar-initials">{initials}</span>
                              <span className="truncate">
                                {agentName}{isMe ? " (You)" : ""}
                              </span>
                            </div>
                            <span className="team-sidebar-badge">{count}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
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
                title={`View all ${count2ndLineTotal} incidents for 2nd Line Support`}
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
                    title={`View ${count2ndLineUnassigned} unassigned tickets`}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#7c3aed", fontSize: 14 }}>👤</span>
                      <span>Unassigned</span>
                    </div>
                    <span className="team-sidebar-badge">{count2ndLineUnassigned}</span>
                  </button>

                  {/* Dynamic 2nd Line Agents */}
                  {secondLineAgentNames.length > 0 && (
                    <>
                      <span className="team-section-pill-label available">Support Agents</span>
                      {secondLineAgentNames.map((agentName) => {
                        const count = incidents.filter(
                          (i) => i.team === "2nd Line Support" && i.agent.toLowerCase() === agentName.toLowerCase()
                        ).length;
                        const isMe = user?.fullName && user.fullName.toLowerCase() === agentName.toLowerCase();
                        const initials = agentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <button
                            key={agentName}
                            type="button"
                            className={`team-subitem-btn ${
                              selectedView.kind === "agent" &&
                              selectedView.team === "2nd Line Support" &&
                              selectedView.agent.toLowerCase() === agentName.toLowerCase()
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedView({
                                kind: "agent",
                                team: "2nd Line Support",
                                agent: agentName,
                              })
                            }
                            title={`View ${count} tickets assigned to ${agentName}`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="team-avatar-initials">{initials}</span>
                              <span className="truncate">
                                {agentName}{isMe ? " (You)" : ""}
                              </span>
                            </div>
                            <span className="team-sidebar-badge">{count}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
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
                title={`View all ${countInfrastructure} Infrastructure tickets`}
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
                title={`View all ${countBreachingSLA} Breaching SLA incidents across teams`}
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
                onClick={() => {
                  setIsLoading(true);
                  fetchAllTeamIncidents()
                    .then((res) => {
                      setIncidents(res.incidents);
                      setFirstLineAgents(res.firstLineAgents);
                      setSecondLineAgents(res.secondLineAgents);
                    })
                    .finally(() => setIsLoading(false));
                }}
                title="Refresh table from API"
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

              <div className="relative" ref={tableMenuRef}>
                <button
                  type="button"
                  className="tb-nav-btn"
                  title="Table actions"
                  onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, letterSpacing: '2px', color: '#64748b' }}>···</span>
                </button>
                {isTableMenuOpen && (
                  <div className="team-table-options-menu animate-fadeIn">
                    <button
                      type="button"
                      className="team-table-opt-btn"
                      onClick={() => {
                        handleExportCSV();
                        setIsTableMenuOpen(false);
                      }}
                    >
                      <span>📥</span>
                      <span>Export to CSV</span>
                    </button>
                    <button
                      type="button"
                      className="team-table-opt-btn"
                      onClick={() => {
                        toggleSelectAll();
                        setIsTableMenuOpen(false);
                      }}
                    >
                      <span>☑️</span>
                      <span>{allFilteredSelected ? "Deselect All" : "Select All on Page"}</span>
                    </button>
                    <button
                      type="button"
                      className="team-table-opt-btn"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("Open incidents");
                        setSelectedView({ kind: "team", team: isSecondLine ? "2nd Line Support" : "1st Line Support" });
                        setIsTableMenuOpen(false);
                      }}
                    >
                      <span>🔄</span>
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}
              </div>
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
                  title={`Assign selected incidents to ${user?.fullName || "Agent"}`}
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
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Actioned">Actioned</option>
                    <option value="On Hold">On Hold</option>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="empty-state text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-slate-600">Loading live support incidents from backend...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedIncidents.length > 0 ? (
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
                          <span className={incident.sla.startsWith("-") || incident.sla.includes("Breach") ? "sla-bar-red" : "sla-bar-green"}>
                            {incident.sla}
                          </span>
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
                              incident.status.toLowerCase() === "new" || incident.status.toLowerCase() === "active"
                                ? "status-pill-new"
                                : incident.status.toLowerCase() === "in progress" || incident.status.toLowerCase() === "actioned"
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
                    <td colSpan={10} className="empty-state text-center py-12 text-gray-500">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">No incidents found in this view</p>
                        <p className="text-xs text-slate-400 mt-1">There are currently no tickets matching the selected team, agent, or filter.</p>
                      </div>
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
          currentUser={user?.fullName || "Service Agent"}
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