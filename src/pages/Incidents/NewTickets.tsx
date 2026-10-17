import { useState } from "react";
import type { NewTicket, Priority } from "./incidents.data";
import { TicketDetailModal, type FullTicket } from "../../components/TicketDetailModal";

type NewTicketsProps = {
  tickets: NewTicket[];
  onUpdateTickets?: (updated: NewTicket[]) => void;
};

const PRIORITY_MARKERS: Record<Priority, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#65c51b",
  Unassigned: "#94a3b8",
};

function TicketPriority({ priority }: { priority: Priority }) {
  return (
    <span className="ticket-priority">
      <span
        className="ticket-priority-dot"
        style={{ background: PRIORITY_MARKERS[priority] }}
      />
      {priority}
    </span>
  );
}

function TicketAvatar({ agent }: { agent: string }) {
  const isDemo = !agent || agent === "Unassigned" || agent.includes("Demo") || agent.includes("Admin");
  const displayAgent = isDemo ? "Demo User" : agent;
  return (
    <span className="ticket-agent-cell">
      <div className="table-bubble-avatar">
        <div className="table-bubble-circle">
          <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
          </svg>
        </div>
        <span className="table-bubble-dot" />
      </div>
      <span className="ticket-agent-name font-medium">{displayAgent}</span>
      <span className="trophy-badge text-xs">🏆</span>
    </span>
  );
}

export default function NewTickets({ tickets, onUpdateTickets }: NewTicketsProps) {
  const [selectedTicket, setSelectedTicket] = useState<NewTicket | null>(null);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const start = tickets.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, tickets.length);
  const pagedTickets = tickets.slice((activePage - 1) * pageSize, activePage * pageSize);

  const allVisibleSelected =
    pagedTickets.length > 0 && pagedTickets.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedTickets.some((t) => t.id === id)));
    } else {
      const visibleIds = pagedTickets.map((t) => t.id);
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTicketClick = (ticket: NewTicket) => {
    setSelectedTicket(ticket);
  };

  const handleModalUpdateTicket = (updated: FullTicket) => {
    setSelectedTicket(updated);
    const nextTickets = tickets.map((t) =>
      t.id === updated.id
        ? {
            ...t,
            agent: updated.agent,
            priority: updated.priority as Priority,
            summary: updated.summary,
            type: updated.type,
            status: updated.status,
            description: updated.description,
            requester: updated.requester,
            department: updated.department,
            category: updated.category,
            createdAt: updated.createdAt,
            targetSla: updated.targetSla,
            notes: updated.notes,
          }
        : t
    );
    onUpdateTickets?.(nextTickets);
  };

  const handleBulkAssignToMe = () => {
    const updated = tickets.map((t) =>
      selectedIds.includes(t.id) ? { ...t, agent: "Inesh Agarwal" } : t
    );
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  const handleBulkSetPriority = (priority: Priority) => {
    const updated = tickets.map((t) =>
      selectedIds.includes(t.id) ? { ...t, priority } : t
    );
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    const updated = tickets.filter((t) => !selectedIds.includes(t.id));
    onUpdateTickets?.(updated);
    setSelectedIds([]);
  };

  return (
    <section className="incident-card tickets-card">
      <div className="incident-card-title tickets-card-title">
        <div
          className="tickets-heading"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: "pointer", userSelect: "none" }}
          title={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <h2>My New Tickets</h2>
          <span className="tickets-heading-arrow">▾</span>
        </div>

        {!isCollapsed && (
          <div className="tickets-pagination">
            <span>{start}–{end} of {tickets.length}</span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ opacity: activePage <= 1 ? 0.35 : 1, cursor: activePage <= 1 ? 'default' : 'pointer' }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                color: activePage < totalPages ? "#00b4d8" : "#94a3b8",
                fontWeight: activePage < totalPages ? 700 : 400,
                opacity: activePage >= totalPages ? 0.35 : 1,
                cursor: activePage >= totalPages ? 'default' : 'pointer',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && selectedIds.length > 0 && (
        <div className="tickets-bulk-actions-bar">
          <div className="bulk-selection-count">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>ticket{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>

          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="bulk-btn bulk-btn-assign"
              onClick={handleBulkAssignToMe}
              title="Assign selected tickets to Inesh Agarwal"
            >
              Assign to Me
            </button>

            <div className="bulk-priority-dropdown-wrap">
              <select
                className="bulk-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkSetPriority(e.target.value as Priority);
                    e.target.value = "";
                  }
                }}
                aria-label="Set priority for selected tickets"
              >
                <option value="" disabled>Set Priority ▾</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button
              type="button"
              className="bulk-btn bulk-btn-delete"
              onClick={handleBulkDelete}
              title="Delete selected tickets"
            >
              Delete
            </button>

            <button
              type="button"
              className="bulk-btn bulk-btn-clear"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {!isCollapsed && (
        tickets.length === 0 ? (
          <div className="incident-empty-state">
            <h3>No new tickets found</h3>
            <p>There are no tickets matching the current search.</p>
          </div>
        ) : (
        <div className="ticket-table-scroll">
          <table className="incident-table ticket-table">
            <thead>
              <tr>
                <th className="ticket-check-column">
                  <input
                    type="checkbox"
                    aria-label="Select all tickets"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Ticket Type</th>
                <th>Summary</th>
                <th>Agent</th>
                <th>Priority</th>
              </tr>
            </thead>

            <tbody>
              {pagedTickets.map((ticket) => {
                const cleanNum = ticket.id.replace(/\D/g, "") || "3132";
                const isHovered = hoveredTicketId === ticket.id;

                return (
                  <tr
                    key={ticket.id}
                    className={`incident-row ${isHovered ? "row-hovered" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "INPUT") return;
                      handleTicketClick(ticket);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="ticket-check-column">
                      <input
                        type="checkbox"
                        aria-label={`Select ${ticket.id}`}
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleSelectOne(ticket.id)}
                      />
                    </td>
                    <td
                      className="ticket-id-link"
                      onClick={() => handleTicketClick(ticket)}
                      title="View complete ticket and request details"
                    >
                      {ticket.id}
                    </td>
                    <td>{ticket.type}</td>
                    <td
                      className="ticket-summary-cell"
                      onMouseEnter={() => setHoveredTicketId(ticket.id)}
                      onMouseLeave={() => setHoveredTicketId(null)}
                    >
                      <span
                        className="ticket-summary-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTicketClick(ticket);
                        }}
                        title="Click to view full ticket details"
                      >
                        {ticket.summary}
                      </span>

                      {/* Floating summary preview popover (Image 5) */}
                      {isHovered && (
                        <div
                          className="ticket-hover-popover"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(ticket);
                          }}
                        >
                          <div className="hover-popover-arrow" />
                          <div className="hover-popover-header">
                            <div className="flex items-center gap-2">
                              <span className="hover-badge-new">NEW</span>
                              <span className="hover-ticket-num">Ticket #{cleanNum}</span>
                            </div>
                            <span className="hover-flag-icon" title="Flagged">⚑</span>
                          </div>

                          <div className="hover-popover-title-row">
                            <h4 className="hover-popover-heading">{ticket.summary}</h4>
                            <span className="hover-popover-ago">4 months ago</span>
                          </div>

                          <p className="hover-popover-desc">
                            {ticket.description || "Launch the ITSM system across all departments. Monitor system performance, user adoption, and ticket flow during the initial rollout. Document lessons learned, collect feedback for ongoing improvements, and present a post-implementation review report to stakeholders."}
                          </p>

                          <div className="hover-popover-footer">
                            <div className="hover-dots-spinner">
                              <span className="dot d1" />
                              <span className="dot d2" />
                              <span className="dot d3" />
                              <span className="dot d4" />
                              <span className="dot d5" />
                              <span className="dot d6" />
                              <span className="dot d7" />
                              <span className="dot d8" />
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <TicketAvatar agent={ticket.agent} />
                    </td>
                    <td>
                      <TicketPriority priority={ticket.priority} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleModalUpdateTicket}
        />
      )}
    </section>
  );
}