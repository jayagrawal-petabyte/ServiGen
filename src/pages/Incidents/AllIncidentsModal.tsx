import React, { useState, useMemo, useEffect } from "react";
import type { RecentIncident, Priority, IncidentStatus } from "./incidents.data";
import { PriorityPill, StatusPill } from "./Badges";

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
];

const STATUSES: Array<"All" | IncidentStatus> = [
  "All",
  "In Progress",
  "Open",
  "Resolved",
  "On Hold",
];

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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidents.filter((item) => {
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.assignedTo.toLowerCase().includes(q) ||
        item.organisation.toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [incidents, search, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, filtered.length);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              All Incidents
            </h2>
            <span className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-200">
              {filtered.length} {filtered.length === 1 ? "incident" : "incidents"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, subject, assignee, or organisation…"
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-200 transition-all text-slate-800 placeholder-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 font-medium cursor-pointer focus:border-cyan-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 font-medium cursor-pointer focus:border-cyan-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {(search || priorityFilter !== "All" || statusFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPriorityFilter("All");
                  setStatusFilter("All");
                }}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-medium px-2 py-1 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Incidents Table */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">No matching incidents found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Incident ID</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3">Organisation</th>
                  <th className="py-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => {
                      onSelectIncident(incident);
                    }}
                    className="hover:bg-cyan-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-cyan-700">
                      {incident.id}
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
                    <td className="py-3 px-3 text-slate-600">
                      {incident.assignedTo}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[140px] truncate" title={incident.organisation}>
                      {incident.organisation}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      {incident.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{pageStart}</span> to{" "}
            <span className="font-semibold text-slate-700">{pageEnd}</span> of{" "}
            <span className="font-semibold text-slate-700">{filtered.length}</span> incidents
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
