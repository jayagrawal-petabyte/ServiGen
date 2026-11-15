
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import InlineErrorBanner from '../../components/shared/InlineErrorBanner';
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../Auth/AuthContext";
import { usePersistentState } from "../../utils/persistentState";
import {
  myWorkService,
  parseDurationToMinutes,
  formatMinutes,
  type TicketStatus,
  type MyWorkTicket,
} from "../../services/myWorkService";
import { MOCK_MY_WORK_TICKETS } from "../../services/fallback/mockData";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import { SlaBadge } from "../../components/shared/SlaBadge";
import { StatusPill } from "../../components/shared/StatusBadge";
import { SearchInput } from "../../components/shared";
import {
  Inbox,
  User,
  Users,
  Layers,
  Activity,
  ListFilter,
  RotateCcw,
} from "lucide-react";

export type Ticket = MyWorkTicket;

export type TimeLog = {
  id: number;
  date: string;
  duration: string;
  note: string;
};

const PRIORITY_STYLES: Record<string, string> = {
  "P1 - Critical": "bg-rose-50 text-rose-700 border-rose-200",
  "P2 - High": "bg-amber-50 text-amber-800 border-amber-200",
  "P3 - Medium": "bg-sky-50 text-sky-700 border-sky-200",
  "P4 - Low": "bg-slate-100 text-slate-600 border-slate-300",
};

const PRIORITY_ORDER = [
  "P1 - Critical",
  "P2 - High",
  "P3 - Medium",
  "P4 - Low",
];

const STATUS_FILTERS = [
  { id: "All", label: "All Statuses" },
  { id: "Active", label: "Active" },
  { id: "Pending", label: "Pending" },
  { id: "Actioned", label: "Actioned" },
  { id: "On Hold", label: "On Hold" },
  { id: "Resolved", label: "Resolved" },
];

type PriorityPillProps = {
  priority: string;
};

function PriorityPill({ priority }: PriorityPillProps) {
  const className =
    PRIORITY_STYLES[priority] ||
    "bg-slate-100 text-slate-600 border-slate-300";

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        className
      }
    >
      {priority}
    </span>
  );
}

interface ViewOption {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "my-list", label: "My List", Icon: Inbox },
  { id: "tickets-agents", label: "Tickets by Agents", Icon: User },
  { id: "tickets-team", label: "Tickets by Team", Icon: Users },
  { id: "tickets-type", label: "Tickets by Type", Icon: Layers },
  { id: "tickets-status", label: "Tickets by Status", Icon: Activity },
  { id: "all-tickets", label: "All Tickets", Icon: ListFilter },
];

export default function MyWork() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<string>("My List");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [agentFilter, setAgentFilter] = useState<string>("All");
  const [teamFilter, setTeamFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = usePersistentState<Ticket[]>(
    "servigen_my_work_tickets_v1",
    []
  );
  const [serverTickets, setServerTickets] = useState<Ticket[]>([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeLogs, setTimeLogs] = usePersistentState<Record<string, TimeLog[]>>(
    "servigen_my_work_time_logs_v1",
    {}
  );
  const [showAddTimeLog, setShowAddTimeLog] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newNote, setNewNote] = useState("");

  const loadTickets = useCallback(async () => {
    setIsFetchingTickets(true);
    try {
      const live = await myWorkService.getAllTickets();
      // An empty queue is a valid answer; show it rather than stale rows.
      setServerTickets(Array.isArray(live) ? live : []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your tickets.');
    } finally {
      setIsFetchingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const allTickets = useMemo(() => {
    const map = new Map<string, Ticket>();
    serverTickets.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [serverTickets]);

  // Available options for contextual filters
  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    allTickets.forEach((t) => {
      if (t.assignedAgent && t.assignedAgent !== "Unassigned") set.add(t.assignedAgent);
    });
    return Array.from(set).sort();
  }, [allTickets]);

  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    allTickets.forEach((t) => {
      if (t.assignedTeam) set.add(t.assignedTeam);
    });
    return Array.from(set).sort();
  }, [allTickets]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    allTickets.forEach((t) => {
      if (t.ticketType) set.add(t.ticketType);
    });
    return Array.from(set).sort();
  }, [allTickets]);

  // Counts for each view in the primary navigation
  const viewCounts = useMemo(() => {
    const currentUserName = (user?.fullName || "Adam Admin").toLowerCase();
    const myList = allTickets.filter((t) => {
      const ag = (t.assignedAgent || "").toLowerCase();
      return t.id.startsWith("MYW-") || ag.includes(currentUserName) || ag.includes("adam");
    }).length;

    const agentsCount = allTickets.filter((t) => Boolean(t.assignedAgent) && t.assignedAgent !== "Unassigned").length;
    const teamCount = allTickets.filter((t) => Boolean(t.assignedTeam)).length;
    const typeCount = allTickets.filter((t) => Boolean(t.ticketType)).length;
    const statusCount = allTickets.filter((t) => ["Active", "Pending"].includes(t.status)).length;
    const allCount = allTickets.length;

    return {
      "My List": myList,
      "Tickets by Agents": agentsCount,
      "Tickets by Team": teamCount,
      "Tickets by Type": typeCount,
      "Tickets by Status": statusCount,
      "All Tickets": allCount,
    };
  }, [allTickets, user]);

  // Base tickets matching the active view (to compute accurate status counts)
  const baseViewTickets = useMemo(() => {
    const currentUserName = (user?.fullName || "Adam Admin").toLowerCase();
    return allTickets.filter((t) => {
      if (activeView === "My List") {
        const ag = (t.assignedAgent || "").toLowerCase();
        return t.id.startsWith("MYW-") || ag.includes(currentUserName) || ag.includes("adam");
      }
      return true;
    });
  }, [allTickets, activeView, user]);

  // Counts for shifted status filter
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: baseViewTickets.length,
      Active: 0,
      Pending: 0,
      Actioned: 0,
      "On Hold": 0,
      Resolved: 0,
    };
    baseViewTickets.forEach((t) => {
      const st = t.status;
      if (st === "Active") counts.Active = (counts.Active || 0) + 1;
      else if (st === "Pending") counts.Pending = (counts.Pending || 0) + 1;
      else if (st === "Actioned") counts.Actioned = (counts.Actioned || 0) + 1;
      else if (st === "On Hold") counts["On Hold"] = (counts["On Hold"] || 0) + 1;
      else if (st === "Resolved" || st === "Closed") counts.Resolved = (counts.Resolved || 0) + 1;
    });
    return counts;
  }, [baseViewTickets]);

  const viewSubtitle = useMemo(() => {
    switch (activeView) {
      case "My List":
        return (
          <>
            Tickets currently assigned to <span className="font-semibold text-slate-700">{user?.fullName || "Adam Admin"}</span>, sorted by priority.
          </>
        );
      case "All Tickets":
        return <>All organisation tickets across all teams, types, and agents, sorted by priority.</>;
      case "Tickets by Agents":
        return <>Tickets grouped and filtered by assigned agent across service desks.</>;
      case "Tickets by Team":
        return <>Tickets distributed across 1st Line, 2nd Line, and specialist support teams.</>;
      case "Tickets by Type":
        return <>Tickets categorized by Incidents, Service Requests, Problems, and Changes.</>;
      case "Tickets by Status":
        return <>Tickets tracked by workflow lifecycle status (Active, Pending, Actioned, On Hold, Resolved).</>;
      default:
        return <>Tickets sorted by priority.</>;
    }
  }, [activeView, user]);

  const filteredTickets = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    const currentUserName = (user?.fullName || "Adam Admin").toLowerCase();

    return allTickets.filter((ticket) => {
      // 1. View-level filtering
      if (activeView === "My List") {
        const agentName = (ticket.assignedAgent || "").toLowerCase();
        const isMyTicket = ticket.id.startsWith("MYW-") || agentName.includes(currentUserName) || agentName.includes("adam");
        if (!isMyTicket) return false;
      } else if (activeView === "Tickets by Agents") {
        if (agentFilter !== "All" && ticket.assignedAgent !== agentFilter) {
          return false;
        }
      } else if (activeView === "Tickets by Team") {
        if (teamFilter !== "All" && ticket.assignedTeam !== teamFilter) {
          return false;
        }
      } else if (activeView === "Tickets by Type") {
        if (typeFilter !== "All" && ticket.ticketType?.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== "All") {
        const stLower = (ticket.status || "").toLowerCase();
        if (statusFilter === "Resolved") {
          if (stLower !== "resolved" && stLower !== "closed") return false;
        } else if (stLower !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Priority filter
      if (priorityFilter !== "All" && ticket.priority !== priorityFilter) {
        return false;
      }

      // 4. Search query
      if (searchText.length > 0) {
        const matchesSearch =
          ticket.id.toLowerCase().includes(searchText) ||
          ticket.organisation.toLowerCase().includes(searchText) ||
          ticket.summary.toLowerCase().includes(searchText) ||
          (ticket.assignedAgent && ticket.assignedAgent.toLowerCase().includes(searchText)) ||
          (ticket.assignedTeam && ticket.assignedTeam.toLowerCase().includes(searchText)) ||
          (ticket.ticketType && ticket.ticketType.toLowerCase().includes(searchText));
        if (!matchesSearch) return false;
      }

      return true;
    }).sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) -
        PRIORITY_ORDER.indexOf(b.priority)
    );
  }, [allTickets, activeView, statusFilter, priorityFilter, agentFilter, teamFilter, typeFilter, query, user]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setQuery(event.target.value);
  };

  const handlePriorityChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setPriorityFilter(event.target.value);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, status: newStatus };
    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setServerTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    await myWorkService.updateTicketStatus(selectedTicket.id, newStatus);
  };

  const handleAddTimeLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTicket) {
      return;
    }

    if (!newDuration.trim() || !newNote.trim()) {
      return;
    }

    const minutes = parseDurationToMinutes(newDuration);
    const newLog: TimeLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      duration: newDuration.trim(),
      note: newNote.trim(),
    };

    setTimeLogs((currentLogs) => ({
      ...currentLogs,
      [selectedTicket.id]: [
        ...(currentLogs[selectedTicket.id] || []),
        newLog,
      ],
    }));

    setNewDuration("");
    setNewNote("");
    setShowAddTimeLog(false);

    // Persist to backend and update timeRecord
    const updatedTicket = await myWorkService.logTime(selectedTicket.id, minutes);
    if (updatedTicket) {
      setSelectedTicket((curr) => curr ? { ...curr, timeRecord: updatedTicket.timeRecord } : null);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? { ...t, timeRecord: updatedTicket.timeRecord } : t)));
      setServerTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? { ...t, timeRecord: updatedTicket.timeRecord } : t)));
    }
  };

  const handleBackToWork = () => {
    setSelectedTicket(null);
    if (searchParams.get('id') || searchParams.get('ticketId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('id');
      next.delete('ticketId');
      setSearchParams(next, { replace: true });
    }
  };

  // Handle tab/status deep linking (e.g. /my-work?tab=Active or /my-work?view=All%20Tickets)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const match = STATUS_FILTERS.find((s) => s.id.toLowerCase() === tabParam.toLowerCase() || s.label.toLowerCase() === tabParam.toLowerCase());
      if (match) setStatusFilter(match.id);
    }
    const viewParam = searchParams.get('view');
    if (viewParam) {
      const match = VIEW_OPTIONS.find((v) => v.label.toLowerCase() === viewParam.toLowerCase() || v.id.toLowerCase() === viewParam.toLowerCase());
      if (match) setActiveView(match.label);
    }
  }, [searchParams]);

  // Handle direct ticket deep-linking (e.g. /my-work?id=MYW-101)
  useEffect(() => {
    const targetId = searchParams.get('id') || searchParams.get('ticketId');
    if (!targetId) return;

    if (selectedTicket && selectedTicket.id.toLowerCase() === targetId.toLowerCase()) {
      return;
    }

    const clean = targetId.toLowerCase().replace(/^#?myw-?/i, '').trim();

    const match = allTickets.find(
      (t) =>
        t.id.toLowerCase() === targetId.toLowerCase() ||
        t.id.toLowerCase().replace(/^#?myw-?/i, '') === clean ||
        t.id.replace(/\D/g, '') === clean
    );

    if (match) {
      setSelectedTicket(match);
    } else if (!isFetchingTickets) {
      const fallbackMatch = MOCK_MY_WORK_TICKETS.find(
        (t) =>
          t.id.toLowerCase() === targetId.toLowerCase() ||
          t.id.toLowerCase().replace(/^#?myw-?/i, '') === clean ||
          t.id.replace(/\D/g, '') === clean
      );
      if (fallbackMatch) {
        setSelectedTicket(fallbackMatch as Ticket);
      }
    }
  }, [searchParams, allTickets, selectedTicket, isFetchingTickets]);

  if (selectedTicket) {
    const logs = timeLogs[selectedTicket.id] || [];

    return (
      <div className="flex-1 w-full min-h-full flex flex-col bg-slate-50">
        {/* Top Navbar */}
        <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="hover:text-gray-800 cursor-pointer" onClick={handleBackToWork}>Service Desk</span>
            <span>/</span>
            <span className="hover:text-gray-800 cursor-pointer" onClick={handleBackToWork}>My Work</span>
            <span>/</span>
            <span className="text-gray-900">{selectedTicket.id}</span>
          </div>
          <GlobalNavbarActions
            onOpenTicket={(id) => {
              const match = allTickets.find((t) => t.id === id);
              if (match) setSelectedTicket(match);
            }}
          />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              onClick={handleBackToWork}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to My Work
            </button>

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900">
                  {selectedTicket.id}
                </h1>

                <PriorityPill priority={selectedTicket.priority} />
                <StatusPill status={selectedTicket.status} />
              </div>

              <p className="text-sm text-slate-500">
                {selectedTicket.organisation}
              </p>

              <p className="mt-3 text-base text-slate-800">
                {selectedTicket.summary}
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Ticket Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ticket ID
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedTicket.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Organisation
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedTicket.organisation}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Priority
                </p>
                <div className="mt-1">
                  <PriorityPill priority={selectedTicket.priority} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill status={selectedTicket.status} />
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Actioned">Actioned</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Summary
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedTicket.summary}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Recorded Time
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedTicket.timeRecord}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  SLA Time Left
                </p>
                <div className="mt-1">
                  <SlaBadge
                    ticketId={selectedTicket.id}
                    slaTimeLeft={selectedTicket.slaTimeLeft}
                    slaFormatted={selectedTicket.slaFormatted}
                    resolutionTargetAt={(selectedTicket as any).resolutionTargetAt}
                    createdAt={selectedTicket.createdAt}
                    priority={selectedTicket.priority}
                    status={selectedTicket.status}
                    variant="restrained"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Time Logs
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Work recorded against this ticket.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTimeLog(!showAddTimeLog)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {showAddTimeLog ? "Cancel" : "Add Time Log"}
              </button>
            </div>

            {showAddTimeLog && (
              <form
                onSubmit={handleAddTimeLog}
                className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(event) =>
                      setNewDuration(event.target.value)
                    }
                    placeholder="Duration e.g. 30m"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />

                  <input
                    type="text"
                    value={newNote}
                    onChange={(event) =>
                      setNewNote(event.target.value)
                    }
                    placeholder="Work note"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save Time Log
                </button>
              </form>
            )}

            {logs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                No time logs recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {log.date}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                          {log.duration}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {log.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="flex-1 w-full min-h-full flex flex-col bg-slate-50">
      <InlineErrorBanner message={loadError} onRetry={loadTickets} />
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">{activeView === "My List" ? "My Work" : activeView}</span>
        </div>
        <GlobalNavbarActions
          onOpenTicket={(id) => {
            const match = allTickets.find((t) => t.id === id);
            if (match) setSelectedTicket(match);
          }}
        />
      </header>

      {/* ── Two-Column Layout (Sidebar + Main Content) ── */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Left Sidebar Panel */}
        <aside
          className={`transition-all duration-200 shrink-0 flex flex-col py-5 bg-white border border-gray-200 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] my-3 ml-3 overflow-hidden ${
            isSidebarCollapsed ? "w-16 px-2" : "w-[260px] px-3.5"
          }`}
        >
          {/* Sidebar Header with Collapse Toggle */}
          <div
            className={
              "flex items-center mb-3.5 pb-2.5 border-b border-slate-100 " +
              (isSidebarCollapsed ? "justify-center" : "justify-between px-1")
            }
          >
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Views
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar (>>)" : "Collapse sidebar (<<)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? ">>" : "<<"}
            </button>
          </div>

          {/* Sidebar Record Search */}
          {!isSidebarCollapsed && (
            <div className="mb-3 px-0.5">
              <SearchInput
                size="sm"
                value={query}
                onChange={setQuery}
                placeholder="Search my work tickets..."
                className="bg-white"
              />
            </div>
          )}

          {/* Sidebar Body with Views & Shifted Filters */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-3">
            {/* Primary Views Navigation */}
            <nav className="flex flex-col gap-1" aria-label="Views">
              {VIEW_OPTIONS.map((item) => {
                const isActive = activeView === item.label;
                const Icon = item.Icon;
                const count = viewCounts[item.label as keyof typeof viewCounts] ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveView(item.label);
                      setAgentFilter("All");
                      setTeamFilter("All");
                      setTypeFilter("All");
                    }}
                    title={isSidebarCollapsed ? `${item.label} (${count})` : undefined}
                    className={
                      "flex items-center text-xs transition-all cursor-pointer " +
                      (isSidebarCollapsed
                        ? "justify-center w-10 h-10 mx-auto p-0 rounded-full "
                        : "w-full justify-between px-3 py-2 rounded-full ") +
                      (isActive
                        ? "bg-[#C96F55] text-white font-bold shadow-xs [&>div>div>svg]:!text-white [&>div>div>svg]:!stroke-white"
                        : "text-slate-700 hover:bg-slate-100 font-medium")
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {!isSidebarCollapsed && (
              <>
                <hr className="border-slate-100 my-2" />

                {/* Shifted Status Filter Section */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                    Status
                  </div>
                  <div className="flex flex-col gap-1">
                    {STATUS_FILTERS.map((s) => {
                      const isSelected = statusFilter === s.id;
                      const count = statusCounts[s.id] ?? 0;

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setStatusFilter(s.id)}
                          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FDE9E1] text-[#C96F55] font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{s.label}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-[#C96F55] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shifted Priority Filter Section */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-2.5 mb-1.5">
                    Priority
                  </div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]/20 cursor-pointer"
                  >
                    <option value="All">All Priorities</option>
                    {PRIORITY_ORDER.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contextual Sub-Filters */}
                {activeView === "Tickets by Agents" && availableAgents.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-2.5 mb-1.5">
                      Agent
                    </div>
                    <select
                      value={agentFilter}
                      onChange={(e) => setAgentFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]/20 cursor-pointer"
                    >
                      <option value="All">All Agents</option>
                      {availableAgents.map((ag) => (
                        <option key={ag} value={ag}>{ag}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeView === "Tickets by Team" && availableTeams.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-2.5 mb-1.5">
                      Team
                    </div>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]/20 cursor-pointer"
                    >
                      <option value="All">All Teams</option>
                      {availableTeams.map((tm) => (
                        <option key={tm} value={tm}>{tm}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeView === "Tickets by Type" && availableTypes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-2.5 mb-1.5">
                      Ticket Type
                    </div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]/20 cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      {availableTypes.map((tp) => (
                        <option key={tp} value={tp}>{tp}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset All Filters Button */}
                {(statusFilter !== "All" || priorityFilter !== "All" || agentFilter !== "All" || teamFilter !== "All" || typeFilter !== "All" || query.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("All");
                      setPriorityFilter("All");
                      setAgentFilter("All");
                      setTeamFilter("All");
                      setTypeFilter("All");
                      setQuery("");
                    }}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 py-1.5 text-xs font-bold text-[#C96F55] hover:bg-[#FDE9E1] rounded-lg transition-colors cursor-pointer border border-[#C96F55]/20"
                  >
                    <RotateCcw size={12} />
                    Reset All Filters
                  </button>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-6 py-6 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            <header className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeView === "My List" ? "My Work" : activeView}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {viewSubtitle}
                </p>
              </div>

              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs self-start sm:self-auto">
                {filteredTickets.length} tickets
              </div>
            </header>

            {/* Shifted bar at top to sidebar — main area table begins directly */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Summary</th>
                    {activeView === "Tickets by Agents" && <th className="px-4 py-3">Assigned Agent</th>}
                    {activeView === "Tickets by Team" && <th className="px-4 py-3">Team</th>}
                    {activeView === "Tickets by Type" && <th className="px-4 py-3">Type</th>}
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">SLA Time Left</th>
                    <th className="px-4 py-3">Time Record</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                        No tickets match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                          {ticket.id}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <PriorityPill priority={ticket.priority} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {ticket.organisation}
                        </td>

                        <td className="px-4 py-3 text-slate-700 font-medium max-w-[280px] truncate">
                          {ticket.summary}
                        </td>

                        {activeView === "Tickets by Agents" && (
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {ticket.assignedAgent || "Unassigned"}
                          </td>
                        )}

                        {activeView === "Tickets by Team" && (
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {ticket.assignedTeam || "1st Line Support"}
                          </td>
                        )}

                        {activeView === "Tickets by Type" && (
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {ticket.ticketType || "Incident"}
                            </span>
                          </td>
                        )}

                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusPill status={ticket.status} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <SlaBadge
                            ticketId={ticket.id}
                            slaTimeLeft={ticket.slaTimeLeft}
                            slaFormatted={ticket.slaFormatted}
                            resolutionTargetAt={(ticket as any).resolutionTargetAt}
                            createdAt={ticket.createdAt}
                            priority={ticket.priority}
                            status={ticket.status}
                            variant="restrained"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 font-medium">
                          {formatMinutes(ticket.timeRecord)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

