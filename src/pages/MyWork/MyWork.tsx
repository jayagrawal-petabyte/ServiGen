import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

type TicketStatus = "Active" | "Pending" | "Actioned";

type Ticket = {
  id: string;
  priority: string;
  organisation: string;
  summary: string;
  timeRecord: string;
  status: TicketStatus;
};

const MOCK_TICKETS: Ticket[] = [
  {
    id: "TCK-30291",
    priority: "P1 - Critical",
    organisation: "Meridian Foods Ltd",
    summary: "Order sync failing between POS and ERP",
    timeRecord: "2h 15m",
    status: "Active",
  },
  {
    id: "TCK-30288",
    priority: "P2 - High",
    organisation: "Northbridge Logistics",
    summary: "Warehouse scanner firmware update request",
    timeRecord: "45m",
    status: "Pending",
  },
  {
    id: "TCK-30271",
    priority: "P3 - Medium",
    organisation: "Aurelia Health",
    summary: "New starter access to imaging system",
    timeRecord: "1h 05m",
    status: "Active",
  },
  {
    id: "TCK-30260",
    priority: "P2 - High",
    organisation: "Solace Retail Group",
    summary: "Checkout page throwing 500 on discount codes",
    timeRecord: "3h 40m",
    status: "Pending",
  },
  {
    id: "TCK-30254",
    priority: "P4 - Low",
    organisation: "Meridian Foods Ltd",
    summary: "Update signage on internal knowledge base article",
    timeRecord: "12m",
    status: "Actioned",
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  "P1 - Critical": "bg-rose-50 text-rose-700 border-rose-200",
  "P2 - High": "bg-amber-50 text-amber-800 border-amber-200",
  "P3 - Medium": "bg-sky-50 text-sky-700 border-sky-200",
  "P4 - Low": "bg-slate-100 text-slate-600 border-slate-300",
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  Active: "bg-green-50 text-green-700 border-green-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Actioned: "bg-slate-100 text-slate-600 border-slate-300",
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
];

type PriorityPillProps = {
  priority: string;
};

function PriorityPill({ priority }: PriorityPillProps) {
  const cls =
    PRIORITY_STYLES[priority] ??
    "bg-slate-100 text-slate-600 border-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {priority}
    </span>
  );
}

type StatusPillProps = {
  status: TicketStatus;
};

function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export default function MyWork() {
  const [query, setQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<TicketStatus>("Active");

  const filtered = useMemo(() => {
    return MOCK_TICKETS.filter((ticket: Ticket) => {
      const matchesStatus = ticket.status === activeTab;

      const matchesPriority =
        priorityFilter === "All" ||
        ticket.priority === priorityFilter;

      const q = query.trim().toLowerCase();

      const matchesQuery =
        !q ||
        ticket.id.toLowerCase().includes(q) ||
        ticket.organisation.toLowerCase().includes(q) ||
        ticket.summary.toLowerCase().includes(q);

      return matchesStatus && matchesPriority && matchesQuery;
    }).sort(
      (a: Ticket, b: Ticket) =>
        PRIORITY_ORDER.indexOf(a.priority) -
        PRIORITY_ORDER.indexOf(b.priority)
    );
  }, [query, priorityFilter, activeTab]);

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

  return (
    <div className="min-h-full bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              My Work
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Tickets currently assigned to you, sorted by priority.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {filtered.length} tickets
          </div>
        </header>

        {/* Status Tabs */}
        <div className="mb-4 border-b border-slate-200">
          <div className="flex gap-6">
            {STATUS_TABS.map((status) => {
              const count = MOCK_TICKETS.filter(
                (ticket) => ticket.status === status
              ).length;

              const isActive = activeTab === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveTab(status)}
                  className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
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

        {/* Search + Filter */}
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

        {/* Ticket Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time Record</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((ticket: Ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() =>
                    console.log(
                      "navigate to ticket",
                      ticket.id
                    )
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {ticket.id}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <PriorityPill
                      priority={ticket.priority}
                    />
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

                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 tabular-nums">
                    {ticket.timeRecord}
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No {activeTab.toLowerCase()} tickets match
                    your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}