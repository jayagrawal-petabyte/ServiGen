import { useEffect, useMemo, useState } from "react";
import type {
  IncidentStatus,
  Priority,
  RecentIncident,
} from "./incidents.data";
import { PriorityPill, StatusPill } from "./Badges";
import { SlaBadge } from "../../components/shared/SlaBadge";
import { ModalShell } from "../../components/shared/ModalShell";
import { FilterToolbar } from "../../components/shared/FilterToolbar";

interface AllIncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: RecentIncident[];
  onSelectIncident: (incident: RecentIncident) => void;
}

const PAGE_SIZE = 6;

const PRIORITIES: Array<"All" | Priority> = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Low",
  "Unassigned",
];

const STATUSES: Array<"All" | IncidentStatus> = [
  "All",
  "In Progress",
  "Open",
  "Resolved",
  "On Hold",
];

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatDate(value: string): string {
  if (!value || value === "—") return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function AllIncidentsModal({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
}: AllIncidentsModalProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | IncidentStatus>("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((item) => {
      const searchableText = [
        item.id,
        item.subject,
        item.assignedTo,
        item.organisation,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [incidents, search, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const pageStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, filtered.length);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="All Incidents"
      headerActions={
        <span className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-200">
          {filtered.length} {filtered.length === 1 ? "incident" : "incidents"}
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-slate-500">
          <div aria-live="polite">
            Showing <span className="font-semibold text-slate-700">{pageStart}</span> to{" "}
            <span className="font-semibold text-slate-700">{pageEnd}</span> of{" "}
            <span className="font-semibold text-slate-700">{filtered.length}</span> incidents
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700" aria-current="page">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      }
    >
      <div>
        {/* Search & Filter Toolbar */}
        <div className="p-4 px-6 border-b border-slate-100 bg-white">
          <FilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by ID, subject, assignee, or organisation…"
            className="border-0 p-0 shadow-none"
            filters={
              <>
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(event.target.value as "All" | Priority)
                    }
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 font-medium cursor-pointer focus:border-cyan-500"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "All" | IncidentStatus)
                    }
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 font-medium cursor-pointer focus:border-cyan-500"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
            actions={
              (search || priorityFilter !== "All" || statusFilter !== "All") ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPriorityFilter("All");
                    setStatusFilter("All");
                  }}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-medium px-2 py-1 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              ) : null
            }
          />
        </div>

        <div className="px-6 py-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center" role="status">
              <p className="text-sm font-semibold text-slate-700">
                No matching incidents found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search terms or filter criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">Incident records matching the selected filters</caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-3">Incident ID</th>
                  <th scope="col" className="py-3 px-3">Subject</th>
                  <th scope="col" className="py-3 px-3">Priority</th>
                  <th scope="col" className="py-3 px-3">Status</th>
                  <th scope="col" className="py-3 px-3">SLA Time Left</th>
                  <th scope="col" className="py-3 px-3">Assigned To</th>
                  <th scope="col" className="py-3 px-3">Organisation</th>
                  <th scope="col" className="py-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className="hover:bg-cyan-50/50 cursor-pointer transition-colors group focus-within:bg-cyan-50/50"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-cyan-700">
                      <button
                        type="button"
                        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        onClick={() => onSelectIncident(incident)}
                        aria-label={`View incident ${incident.id}: ${incident.subject}`}
                      >
                        {incident.id}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={incident.subject}>
                      {incident.subject}
                    </td>
                    <td className="py-3 px-3">
                      <PriorityPill priority={incident.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status={incident.status} />
                    </td>
                    <td className="py-3 px-3">
                      <SlaBadge slaTimeLeft={incident.slaTimeLeft} status={incident.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-600">{incident.assignedTo || "Unassigned"}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-[140px] truncate" title={incident.organisation}>
                      {incident.organisation || "—"}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      {formatDate(incident.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </ModalShell>
  );
}
