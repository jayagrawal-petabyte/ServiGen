
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../Auth/AuthContext";
import { usePersistentState } from "../../utils/persistentState";
import {
  myWorkService,
  parseDurationToMinutes,
  type TicketStatus,
  type MyWorkTicket,
} from "../../services/myWorkService";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import { SlaBadge } from "../../components/shared/SlaBadge";
import { StatusPill } from "../../components/shared/StatusBadge";

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

const STATUS_TABS: TicketStatus[] = [
  "Active",
  "Pending",
  "Actioned",
  "On Hold",
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
  icon: (active: boolean) => React.ReactNode;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: "my-list",
    label: "My List",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
      </svg>
    ),
  },
  {
    id: "tickets-agents",
    label: "Tickets by Agents",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
  {
    id: "tickets-team",
    label: "Tickets by Team",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    id: "tickets-type",
    label: "Tickets by Type",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="16" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    id: "tickets-status",
    label: "Tickets by Status",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    id: "all-tickets",
    label: "All Tickets",
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

export default function MyWork() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<string>("My List");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<TicketStatus>("Active");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = usePersistentState<Ticket[]>(
    "servigen_my_work_tickets_v1",
    []
  );
  const [serverTickets, setServerTickets] = useState<Ticket[]>([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
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
      const live = await myWorkService.getMyWorkTickets();
      if (Array.isArray(live) && live.length > 0) {
        setServerTickets(live);
      }
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

  const filteredTickets = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return allTickets.filter((ticket) => {
      const matchesStatus = ticket.status === activeTab;

      const matchesPriority =
        priorityFilter === "All" ||
        ticket.priority === priorityFilter;

      const matchesSearch =
        searchText.length === 0 ||
        ticket.id.toLowerCase().includes(searchText) ||
        ticket.organisation.toLowerCase().includes(searchText) ||
        ticket.summary.toLowerCase().includes(searchText);

      return matchesStatus && matchesPriority && matchesSearch;
    }).sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) -
        PRIORITY_ORDER.indexOf(b.priority)
    );
  }, [allTickets, query, priorityFilter, activeTab]);

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

  if (selectedTicket) {
    const logs = timeLogs[selectedTicket.id] || [];

    return (
      <div className="flex-1 w-full min-h-full flex flex-col bg-slate-50">
        {/* Top Navbar */}
        <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="hover:text-gray-800 cursor-pointer" onClick={() => setSelectedTicket(null)}>Service Desk</span>
            <span>/</span>
            <span className="hover:text-gray-800 cursor-pointer" onClick={() => setSelectedTicket(null)}>My Work</span>
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
              onClick={() => setSelectedTicket(null)}
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
                  <SlaBadge slaTimeLeft={selectedTicket.slaTimeLeft} slaFormatted={selectedTicket.slaFormatted} />
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
          className={`transition-all duration-200 shrink-0 flex flex-col py-5 bg-[#e49b8e] border-r border-[#d4887b] h-auto min-h-full ${
            isSidebarCollapsed ? "w-16 px-2" : "w-64 px-4"
          }`}
        >
          {/* Sidebar Header with Collapse Toggle */}
          <div
            className={
              "flex items-center mb-4 pb-3 border-b border-[#d4887b] " +
              (isSidebarCollapsed ? "justify-center" : "justify-between px-1")
            }
          >
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#542d25]">
                Views
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-[#3a201a] hover:bg-black/5 transition-colors text-xs font-bold cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar (>>)" : "Collapse sidebar (<<)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? ">>" : "<<"}
            </button>
          </div>

          {/* View Options List */}
          <nav className="flex flex-col gap-1.5" aria-label="Views">
            {VIEW_OPTIONS.map((item) => {
              const isActive = activeView === item.label;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.label)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={
                    "flex items-center rounded-lg text-sm transition-all cursor-pointer " +
                    (isSidebarCollapsed
                      ? "justify-center w-10 h-10 mx-auto p-0 "
                      : "w-full gap-3 px-3 py-2.5 ") +
                    (isActive
                      ? "bg-[#d28072] text-[#1c0f0c] font-bold shadow-2xs"
                      : "text-[#3a201a] hover:bg-black/5 font-medium")
                  }
                >
                  <div className={`shrink-0 ${isActive ? "text-[#1c0f0c]" : "text-[#3a201a]"}`}>
                    {item.icon(isActive)}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-6 py-6 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeView === "My List" ? "My Work" : activeView}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Tickets currently assigned to <span className="font-semibold text-slate-700">{user?.fullName || ''}</span>, sorted by priority.
                </p>
              </div>

              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs self-start sm:self-auto">
                {filteredTickets.length} tickets
              </div>
            </header>

            <div className="mb-4 border-b border-slate-200">
              <div className="flex gap-6">
              {STATUS_TABS.map((status) => {
                const count = allTickets.filter(
                  (ticket) => ticket.status === status
                ).length;

                const isActive = activeTab === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveTab(status)}
                    className={
                      "border-b-2 px-1 pb-3 text-sm font-medium transition " +
                      (isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-800")
                    }
                  >
                    {status}

                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search by ticket ID, organisation, or summary"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={handlePriorityChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="All">All priorities</option>

              {PRIORITY_ORDER.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">SLA Time Left</th>
                  <th className="px-4 py-3">Time Record</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer hover:bg-slate-50"
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

                    <td className="px-4 py-3 text-slate-700">
                      {ticket.summary}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill status={ticket.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <SlaBadge slaTimeLeft={ticket.slaTimeLeft} slaFormatted={ticket.slaFormatted} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {ticket.timeRecord}
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      No {activeTab.toLowerCase()} tickets match your
                      filters.
                    </td>
                  </tr>
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

